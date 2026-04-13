from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from mongomock_motor import AsyncMongoMockClient

import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection (mocked)
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncMongoMockClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'dischargeflow')]

# Create the main app
app = FastAPI(title="DischargeFlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get('CORS_ORIGINS', 'http://localhost:3000')],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create routers
api_router = APIRouter(prefix="/api")
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
patients_router = APIRouter(prefix="/patients", tags=["Patients"])
workflows_router = APIRouter(prefix="/workflows", tags=["Workflows"])
notifications_router = APIRouter(prefix="/notifications", tags=["Notifications"])
analytics_router = APIRouter(prefix="/analytics", tags=["Analytics"])
ai_router = APIRouter(prefix="/ai", tags=["AI"])

# ========================
# MODELS
# ========================

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "nurse"  # physician, nurse, pharmacist, admin
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    session_id: str = Field(default_factory=lambda: f"sess_{uuid.uuid4().hex[:16]}")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Patient(BaseModel):
    patient_id: str = Field(default_factory=lambda: f"pat_{uuid.uuid4().hex[:12]}")
    name: str
    date_of_birth: str
    admission_date: str
    room_number: str
    diagnosis: str
    attending_physician: str
    status: str = "admitted"  # admitted, pending_discharge, discharged
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PatientCreate(BaseModel):
    name: str
    date_of_birth: str
    admission_date: str
    room_number: str
    diagnosis: str
    attending_physician: str

class DischargeWorkflow(BaseModel):
    workflow_id: str = Field(default_factory=lambda: f"wf_{uuid.uuid4().hex[:12]}")
    patient_id: str
    initiated_by: str  # user_id
    status: str = "in_progress"  # in_progress, pending_approval, completed, cancelled
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    estimated_discharge_time: Optional[datetime] = None

class Task(BaseModel):
    task_id: str = Field(default_factory=lambda: f"task_{uuid.uuid4().hex[:12]}")
    workflow_id: str
    patient_id: str
    title: str
    description: str
    category: str  # documentation, medication, billing, follow_up, education
    assigned_role: str  # physician, nurse, pharmacist
    assigned_to: Optional[str] = None  # user_id
    status: str = "pending"  # pending, in_progress, completed
    priority: int = 2  # 1=high, 2=medium, 3=low
    completed_by: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TaskUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None

class DischargeSummary(BaseModel):
    summary_id: str = Field(default_factory=lambda: f"sum_{uuid.uuid4().hex[:12]}")
    workflow_id: str
    patient_id: str
    content: str
    generated_by: str = "ai"  # ai or manual
    approved: bool = False
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Notification(BaseModel):
    notification_id: str = Field(default_factory=lambda: f"notif_{uuid.uuid4().hex[:12]}")
    user_id: str
    title: str
    message: str
    type: str = "info"  # info, success, warning, error
    read: bool = False
    link: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RoleUpdate(BaseModel):
    role: str

class GenerateSummaryRequest(BaseModel):
    patient_id: str
    workflow_id: str

# ========================
# AUTH HELPERS
# ========================

async def get_current_user(request: Request) -> User:
    """Extract and validate user from session token"""
    # Check cookie first, then Authorization header
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)

def require_roles(allowed_roles: List[str]):
    """Dependency to check user role"""
    async def role_checker(user: User = Depends(get_current_user)):
        if user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

# ========================
# AUTH ROUTES
# ========================

@auth_router.post("/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id for session_token"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get user data
    async with httpx.AsyncClient() as client_http:
        try:
            auth_response = await client_http.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id},
                timeout=10.0
            )
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session_id")
            
            user_data = auth_response.json()
        except Exception as e:
            logging.error(f"Auth error: {e}")
            raise HTTPException(status_code=401, detail="Authentication failed")
    
    # Check if user exists
    existing_user = await db.users.find_one(
        {"email": user_data["email"]},
        {"_id": 0}
    )
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": user_data["name"],
                "picture": user_data.get("picture"),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id,
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data.get("picture"),
            "role": "nurse",  # Default role
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
        
        # Create welcome notification
        notif = {
            "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
            "user_id": user_id,
            "title": "Welcome to DischargeFlow",
            "message": "Your account has been created. Contact an administrator to update your role.",
            "type": "info",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notif)
    
    # Create session
    session_token = user_data.get("session_token", f"st_{uuid.uuid4().hex}")
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session_doc = {
        "session_id": f"sess_{uuid.uuid4().hex[:16]}",
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60  # 7 days
    )
    
    # Get updated user
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    return {"success": True, "user": user_doc}

@auth_router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    """Get current user info"""
    return user.model_dump()

@auth_router.post("/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(
        key="session_token",
        path="/",
        secure=True,
        samesite="none"
    )
    return {"success": True}

# ========================
# USER MANAGEMENT (Admin)
# ========================

@api_router.get("/users")
async def get_users(user: User = Depends(require_roles(["admin"]))):
    """Get all users (admin only)"""
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    return users

@api_router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role_update: RoleUpdate,
    user: User = Depends(require_roles(["admin"]))
):
    """Update user role (admin only)"""
    valid_roles = ["physician", "nurse", "pharmacist", "admin"]
    if role_update.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {valid_roles}")
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"role": role_update.role}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True, "role": role_update.role}

# ========================
# PATIENT ROUTES
# ========================

@patients_router.get("")
async def get_patients(
    status: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    """Get all patients"""
    query = {}
    if status:
        query["status"] = status
    patients = await db.patients.find(query, {"_id": 0}).sort("admission_date", -1).to_list(1000)
    return patients

@patients_router.get("/{patient_id}")
async def get_patient(patient_id: str, user: User = Depends(get_current_user)):
    """Get single patient"""
    patient = await db.patients.find_one({"patient_id": patient_id}, {"_id": 0})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@patients_router.post("")
async def create_patient(
    patient_data: PatientCreate,
    user: User = Depends(require_roles(["physician", "nurse", "admin"]))
):
    """Create new patient"""
    patient = Patient(**patient_data.model_dump())
    doc = patient.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    
    # Create clean copy for response
    response_doc = doc.copy()
    
    await db.patients.insert_one(doc)
    return response_doc

@patients_router.put("/{patient_id}")
async def update_patient(
    patient_id: str,
    updates: dict,
    user: User = Depends(require_roles(["physician", "nurse", "admin"]))
):
    """Update patient"""
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.patients.update_one(
        {"patient_id": patient_id},
        {"$set": updates}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    patient = await db.patients.find_one({"patient_id": patient_id}, {"_id": 0})
    return patient

# ========================
# WORKFLOW ROUTES
# ========================

@workflows_router.post("/initiate/{patient_id}")
async def initiate_discharge(
    patient_id: str,
    user: User = Depends(require_roles(["physician", "admin"]))
):
    """Initiate discharge workflow for a patient"""
    # Check patient exists
    patient = await db.patients.find_one({"patient_id": patient_id}, {"_id": 0})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check no active workflow
    existing = await db.workflows.find_one({
        "patient_id": patient_id,
        "status": {"$in": ["in_progress", "pending_approval"]}
    }, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Active workflow already exists")
    
    # Create workflow
    workflow = DischargeWorkflow(
        patient_id=patient_id,
        initiated_by=user.user_id,
        estimated_discharge_time=(datetime.now(timezone.utc) + timedelta(hours=2))
    )
    workflow_doc = workflow.model_dump()
    workflow_doc["started_at"] = workflow_doc["started_at"].isoformat()
    workflow_doc["estimated_discharge_time"] = workflow_doc["estimated_discharge_time"].isoformat()
    
    # Create a clean copy for response (without _id)
    response_workflow = workflow_doc.copy()
    
    await db.workflows.insert_one(workflow_doc)
    
    # Create standard tasks
    standard_tasks = [
        {"title": "Complete Discharge Summary", "description": "Generate and approve AI discharge summary", "category": "documentation", "assigned_role": "physician", "priority": 1},
        {"title": "Final Medication Review", "description": "Review and reconcile all medications", "category": "medication", "assigned_role": "pharmacist", "priority": 1},
        {"title": "Prepare Discharge Medications", "description": "Prepare and package medications for patient", "category": "medication", "assigned_role": "pharmacist", "priority": 2},
        {"title": "Patient Education", "description": "Provide discharge instructions and education materials", "category": "education", "assigned_role": "nurse", "priority": 2},
        {"title": "Schedule Follow-up Appointments", "description": "Schedule necessary follow-up appointments", "category": "follow_up", "assigned_role": "nurse", "priority": 2},
        {"title": "Billing Clearance", "description": "Verify insurance and billing clearance", "category": "billing", "assigned_role": "nurse", "priority": 3},
        {"title": "Final Vitals Check", "description": "Record final vital signs before discharge", "category": "documentation", "assigned_role": "nurse", "priority": 1},
        {"title": "Remove IV and Equipment", "description": "Remove IV lines and return equipment", "category": "documentation", "assigned_role": "nurse", "priority": 2},
    ]
    
    for task_data in standard_tasks:
        task = Task(
            workflow_id=workflow.workflow_id,
            patient_id=patient_id,
            **task_data
        )
        task_doc = task.model_dump()
        task_doc["created_at"] = task_doc["created_at"].isoformat()
        await db.tasks.insert_one(task_doc)
    
    # Update patient status
    await db.patients.update_one(
        {"patient_id": patient_id},
        {"$set": {"status": "pending_discharge", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Create notifications
    await create_notification_for_role(
        "nurse",
        "New Discharge Initiated",
        f"Discharge workflow started for patient {patient['name']}",
        f"/patients/{patient_id}"
    )
    await create_notification_for_role(
        "pharmacist",
        "Medication Review Required",
        f"Medication review needed for {patient['name']}'s discharge",
        f"/patients/{patient_id}"
    )
    
    return {"workflow": response_workflow, "tasks_created": len(standard_tasks)}

@workflows_router.get("")
async def get_workflows(
    status: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    """Get all workflows"""
    query = {}
    if status:
        query["status"] = status
    workflows = await db.workflows.find(query, {"_id": 0}).sort("started_at", -1).to_list(1000)
    return workflows

@workflows_router.get("/{workflow_id}")
async def get_workflow(workflow_id: str, user: User = Depends(get_current_user)):
    """Get workflow with tasks"""
    workflow = await db.workflows.find_one({"workflow_id": workflow_id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    tasks = await db.tasks.find({"workflow_id": workflow_id}, {"_id": 0}).sort("priority", 1).to_list(100)
    workflow["tasks"] = tasks
    
    # Get discharge summary if exists
    summary = await db.discharge_summaries.find_one({"workflow_id": workflow_id}, {"_id": 0})
    workflow["discharge_summary"] = summary
    
    return workflow

@workflows_router.get("/patient/{patient_id}")
async def get_patient_workflow(patient_id: str, user: User = Depends(get_current_user)):
    """Get active workflow for a patient"""
    workflow = await db.workflows.find_one({
        "patient_id": patient_id,
        "status": {"$in": ["in_progress", "pending_approval"]}
    }, {"_id": 0})
    
    if not workflow:
        return None
    
    tasks = await db.tasks.find({"workflow_id": workflow["workflow_id"]}, {"_id": 0}).sort("priority", 1).to_list(100)
    workflow["tasks"] = tasks
    
    summary = await db.discharge_summaries.find_one({"workflow_id": workflow["workflow_id"]}, {"_id": 0})
    workflow["discharge_summary"] = summary
    
    return workflow

@workflows_router.put("/{workflow_id}/complete")
async def complete_workflow(
    workflow_id: str,
    user: User = Depends(require_roles(["physician", "admin"]))
):
    """Complete discharge workflow"""
    workflow = await db.workflows.find_one({"workflow_id": workflow_id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Check all tasks completed
    pending_tasks = await db.tasks.count_documents({
        "workflow_id": workflow_id,
        "status": {"$ne": "completed"}
    })
    if pending_tasks > 0:
        raise HTTPException(status_code=400, detail=f"{pending_tasks} tasks still pending")
    
    # Check summary approved
    summary = await db.discharge_summaries.find_one({"workflow_id": workflow_id, "approved": True})
    if not summary:
        raise HTTPException(status_code=400, detail="Discharge summary not approved")
    
    # Update workflow
    now = datetime.now(timezone.utc)
    await db.workflows.update_one(
        {"workflow_id": workflow_id},
        {"$set": {"status": "completed", "completed_at": now.isoformat()}}
    )
    
    # Update patient
    await db.patients.update_one(
        {"patient_id": workflow["patient_id"]},
        {"$set": {"status": "discharged", "updated_at": now.isoformat()}}
    )
    
    return {"success": True, "completed_at": now.isoformat()}

# ========================
# TASK ROUTES
# ========================

@api_router.get("/tasks/my")
async def get_my_tasks(user: User = Depends(get_current_user)):
    """Get tasks assigned to current user's role"""
    tasks = await db.tasks.find({
        "assigned_role": user.role,
        "status": {"$ne": "completed"}
    }, {"_id": 0}).sort("priority", 1).to_list(100)
    return tasks

@api_router.get("/tasks")
async def get_tasks(
    role: Optional[str] = None,
    status: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    """Get tasks (optionally filtered by role/status)"""
    query = {}
    if role:
        query["assigned_role"] = role
    if status:
        query["status"] = status
    
    tasks = await db.tasks.find(query, {"_id": 0}).sort("priority", 1).to_list(1000)
    return tasks

@api_router.put("/tasks/{task_id}")
async def update_task(
    task_id: str,
    task_update: TaskUpdate,
    user: User = Depends(get_current_user)
):
    """Update task status"""
    task = await db.tasks.find_one({"task_id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = {}
    if task_update.status:
        update_data["status"] = task_update.status
        if task_update.status == "completed":
            update_data["completed_by"] = user.user_id
            update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
    if task_update.assigned_to:
        update_data["assigned_to"] = task_update.assigned_to
    
    await db.tasks.update_one({"task_id": task_id}, {"$set": update_data})
    
    # Check if all tasks completed
    workflow = await db.workflows.find_one({"workflow_id": task["workflow_id"]}, {"_id": 0})
    if workflow:
        pending = await db.tasks.count_documents({
            "workflow_id": task["workflow_id"],
            "status": {"$ne": "completed"}
        })
        if pending == 0:
            await db.workflows.update_one(
                {"workflow_id": task["workflow_id"]},
                {"$set": {"status": "pending_approval"}}
            )
            # Notify physician
            await create_notification_for_role(
                "physician",
                "Discharge Ready for Approval",
                f"All tasks completed for patient. Ready for final discharge approval.",
                f"/workflows/{task['workflow_id']}"
            )
    
    updated_task = await db.tasks.find_one({"task_id": task_id}, {"_id": 0})
    return updated_task

# ========================
# AI ROUTES
# ========================

@ai_router.post("/generate-summary")
async def generate_discharge_summary(
    req: GenerateSummaryRequest,
    user: User = Depends(require_roles(["physician", "admin"]))
):
    """Generate AI-powered discharge summary"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
    except ImportError:
        LlmChat, UserMessage = None, None

    # Get patient data
    patient = await db.patients.find_one({"patient_id": req.patient_id}, {"_id": 0})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Get workflow
    workflow = await db.workflows.find_one({"workflow_id": req.workflow_id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Check existing summary
    existing = await db.discharge_summaries.find_one({"workflow_id": req.workflow_id})
    if existing:
        raise HTTPException(status_code=400, detail="Summary already exists for this workflow")
    
    # Build prompt
    prompt = f"""Generate a professional hospital discharge summary for the following patient:

Patient Name: {patient['name']}
Date of Birth: {patient['date_of_birth']}
Admission Date: {patient['admission_date']}
Room Number: {patient['room_number']}
Primary Diagnosis: {patient['diagnosis']}
Attending Physician: {patient['attending_physician']}

Please generate a comprehensive discharge summary that includes:
1. Hospital Course Summary
2. Discharge Diagnosis
3. Procedures Performed (if any)
4. Discharge Medications with instructions
5. Activity Restrictions
6. Diet Recommendations
7. Follow-up Instructions
8. Warning Signs to Watch For
9. Emergency Contact Information

Format the summary in a clear, professional medical document style."""

    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="LLM API key not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"discharge_{req.workflow_id}",
            system_message="You are a medical documentation assistant helping generate professional discharge summaries. Be thorough, accurate, and use proper medical terminology."
        ).with_model("gemini", "gemini-3-flash-preview")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Save summary
        summary = DischargeSummary(
            workflow_id=req.workflow_id,
            patient_id=req.patient_id,
            content=response,
            generated_by="ai"
        )
        summary_doc = summary.model_dump()
        summary_doc["created_at"] = summary_doc["created_at"].isoformat()
        
        # Create clean copy for response
        response_summary = summary_doc.copy()
        
        await db.discharge_summaries.insert_one(summary_doc)
        
        return response_summary
        
    except Exception as e:
        logging.error(f"AI generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")

@ai_router.put("/approve-summary/{summary_id}")
async def approve_summary(
    summary_id: str,
    user: User = Depends(require_roles(["physician", "admin"]))
):
    """Approve discharge summary"""
    summary = await db.discharge_summaries.find_one({"summary_id": summary_id}, {"_id": 0})
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found")
    
    now = datetime.now(timezone.utc)
    await db.discharge_summaries.update_one(
        {"summary_id": summary_id},
        {"$set": {
            "approved": True,
            "approved_by": user.user_id,
            "approved_at": now.isoformat()
        }}
    )
    
    # Mark documentation task as complete
    await db.tasks.update_one(
        {"workflow_id": summary["workflow_id"], "title": "Complete Discharge Summary"},
        {"$set": {
            "status": "completed",
            "completed_by": user.user_id,
            "completed_at": now.isoformat()
        }}
    )
    
    return {"success": True, "approved_at": now.isoformat()}

@ai_router.get("/summary/{workflow_id}")
async def get_summary(workflow_id: str, user: User = Depends(get_current_user)):
    """Get discharge summary for workflow"""
    summary = await db.discharge_summaries.find_one({"workflow_id": workflow_id}, {"_id": 0})
    return summary

# ========================
# NOTIFICATION ROUTES
# ========================

async def create_notification_for_role(role: str, title: str, message: str, link: str = None):
    """Create notification for all users with given role"""
    users = await db.users.find({"role": role}, {"_id": 0, "user_id": 1}).to_list(100)
    for u in users:
        notif = {
            "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
            "user_id": u["user_id"],
            "title": title,
            "message": message,
            "type": "info",
            "read": False,
            "link": link,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notif)

@notifications_router.get("")
async def get_notifications(user: User = Depends(get_current_user)):
    """Get user's notifications"""
    notifications = await db.notifications.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return notifications

@notifications_router.put("/{notification_id}/read")
async def mark_notification_read(notification_id: str, user: User = Depends(get_current_user)):
    """Mark notification as read"""
    await db.notifications.update_one(
        {"notification_id": notification_id, "user_id": user.user_id},
        {"$set": {"read": True}}
    )
    return {"success": True}

@notifications_router.put("/read-all")
async def mark_all_read(user: User = Depends(get_current_user)):
    """Mark all notifications as read"""
    await db.notifications.update_many(
        {"user_id": user.user_id, "read": False},
        {"$set": {"read": True}}
    )
    return {"success": True}

# ========================
# ANALYTICS ROUTES
# ========================

@analytics_router.get("/dashboard")
async def get_dashboard_analytics(user: User = Depends(get_current_user)):
    """Get dashboard analytics"""
    # Patient stats
    total_patients = await db.patients.count_documents({})
    admitted = await db.patients.count_documents({"status": "admitted"})
    pending_discharge = await db.patients.count_documents({"status": "pending_discharge"})
    discharged = await db.patients.count_documents({"status": "discharged"})
    
    # Workflow stats
    active_workflows = await db.workflows.count_documents({"status": "in_progress"})
    pending_approval = await db.workflows.count_documents({"status": "pending_approval"})
    completed_today = await db.workflows.count_documents({
        "status": "completed",
        "completed_at": {"$gte": datetime.now(timezone.utc).replace(hour=0, minute=0, second=0).isoformat()}
    })
    
    # Task stats
    pending_tasks = await db.tasks.count_documents({"status": "pending"})
    in_progress_tasks = await db.tasks.count_documents({"status": "in_progress"})
    
    # Calculate average discharge time (for completed workflows)
    completed_workflows = await db.workflows.find(
        {"status": "completed", "completed_at": {"$exists": True}},
        {"_id": 0, "started_at": 1, "completed_at": 1}
    ).to_list(100)
    
    avg_discharge_time = None
    if completed_workflows:
        total_hours = 0
        for wf in completed_workflows:
            started = datetime.fromisoformat(wf["started_at"].replace("Z", "+00:00"))
            completed = datetime.fromisoformat(wf["completed_at"].replace("Z", "+00:00"))
            total_hours += (completed - started).total_seconds() / 3600
        avg_discharge_time = round(total_hours / len(completed_workflows), 1)
    
    return {
        "patients": {
            "total": total_patients,
            "admitted": admitted,
            "pending_discharge": pending_discharge,
            "discharged": discharged
        },
        "workflows": {
            "active": active_workflows,
            "pending_approval": pending_approval,
            "completed_today": completed_today
        },
        "tasks": {
            "pending": pending_tasks,
            "in_progress": in_progress_tasks
        },
        "metrics": {
            "avg_discharge_time_hours": avg_discharge_time
        }
    }

@analytics_router.get("/tasks-by-role")
async def get_tasks_by_role(user: User = Depends(get_current_user)):
    """Get task distribution by role"""
    pipeline = [
        {"$match": {"status": {"$ne": "completed"}}},
        {"$group": {"_id": "$assigned_role", "count": {"$sum": 1}}}
    ]
    results = await db.tasks.aggregate(pipeline).to_list(10)
    return {r["_id"]: r["count"] for r in results if r["_id"]}

# ========================
# SEED DATA
# ========================

@api_router.post("/seed")
async def seed_data():
    """Seed initial data for demo"""
    # Check if already seeded
    existing = await db.patients.count_documents({})
    if existing > 0:
        return {"message": "Data already seeded", "patients": existing}
    
    # Sample patients
    patients = [
        {
            "patient_id": f"pat_{uuid.uuid4().hex[:12]}",
            "name": "John Smith",
            "date_of_birth": "1958-03-15",
            "admission_date": "2026-01-10",
            "room_number": "301A",
            "diagnosis": "Pneumonia with respiratory complications",
            "attending_physician": "Dr. Sarah Johnson",
            "status": "admitted",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "patient_id": f"pat_{uuid.uuid4().hex[:12]}",
            "name": "Maria Garcia",
            "date_of_birth": "1975-08-22",
            "admission_date": "2026-01-08",
            "room_number": "215B",
            "diagnosis": "Post-operative recovery - knee replacement",
            "attending_physician": "Dr. Michael Chen",
            "status": "pending_discharge",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "patient_id": f"pat_{uuid.uuid4().hex[:12]}",
            "name": "Robert Johnson",
            "date_of_birth": "1990-12-01",
            "admission_date": "2026-01-11",
            "room_number": "108",
            "diagnosis": "Acute appendicitis - appendectomy",
            "attending_physician": "Dr. Sarah Johnson",
            "status": "admitted",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "patient_id": f"pat_{uuid.uuid4().hex[:12]}",
            "name": "Emily Watson",
            "date_of_birth": "1982-05-30",
            "admission_date": "2026-01-09",
            "room_number": "402",
            "diagnosis": "Diabetic ketoacidosis management",
            "attending_physician": "Dr. James Williams",
            "status": "admitted",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.patients.insert_many(patients)
    
    return {"message": "Data seeded successfully", "patients": len(patients)}

# ========================
# ROUTER SETUP
# ========================

api_router.include_router(auth_router)
api_router.include_router(patients_router)
api_router.include_router(workflows_router)
api_router.include_router(notifications_router)
api_router.include_router(analytics_router)
api_router.include_router(ai_router)

app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
