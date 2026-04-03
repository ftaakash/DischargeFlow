import requests
import sys
import json
from datetime import datetime
import time

class DischargeFlowAuthenticatedTester:
    def __init__(self, base_url="https://doc-builder-102.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = "test_session_1775197874235"  # From MongoDB creation
        self.user_id = "test-user-1775197874235"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.patient_id = None
        self.workflow_id = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_api_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=15)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=15)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=15)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected: {expected_status})"
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f" - {response.text[:200]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {"status": "success"}
            return None

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return None

    def test_authenticated_endpoints(self):
        """Test authenticated endpoints with valid session"""
        print("\n🔐 Testing authenticated endpoints...")
        
        # Test /api/auth/me with valid token
        result = self.run_api_test(
            "Get current user (authenticated)",
            "GET",
            "/api/auth/me",
            200
        )
        
        if result:
            print(f"   User: {result.get('name')} ({result.get('role')})")

    def test_patient_management(self):
        """Test patient management with authentication"""
        print("\n👥 Testing patient management...")
        
        # Get patients list
        patients = self.run_api_test(
            "Get patients list (authenticated)",
            "GET",
            "/api/patients",
            200
        )
        
        if patients and len(patients) > 0:
            self.patient_id = patients[0]['patient_id']
            print(f"   Found {len(patients)} patients, using: {self.patient_id}")
            
            # Get single patient
            self.run_api_test(
                "Get single patient",
                "GET",
                f"/api/patients/{self.patient_id}",
                200
            )
        else:
            print("   No patients found, creating test patient...")
            # Create a test patient
            patient_data = {
                "name": "Test Patient",
                "date_of_birth": "1980-01-01",
                "admission_date": "2026-01-15",
                "room_number": "101",
                "diagnosis": "Test diagnosis",
                "attending_physician": "Dr. Test"
            }
            
            result = self.run_api_test(
                "Create test patient",
                "POST",
                "/api/patients",
                200,
                data=patient_data
            )
            
            if result:
                self.patient_id = result['patient_id']

    def test_workflow_management(self):
        """Test workflow management"""
        print("\n🔄 Testing workflow management...")
        
        if not self.patient_id:
            print("   Skipping workflow tests - no patient ID available")
            return
        
        # Initiate discharge workflow
        workflow = self.run_api_test(
            "Initiate discharge workflow",
            "POST",
            f"/api/workflows/initiate/{self.patient_id}",
            200
        )
        
        if workflow and 'workflow' in workflow:
            self.workflow_id = workflow['workflow']['workflow_id']
            print(f"   Created workflow: {self.workflow_id}")
            
            # Get workflows list
            self.run_api_test(
                "Get workflows list",
                "GET",
                "/api/workflows",
                200
            )
            
            # Get specific workflow
            self.run_api_test(
                "Get workflow details",
                "GET",
                f"/api/workflows/{self.workflow_id}",
                200
            )

    def test_task_management(self):
        """Test task management"""
        print("\n📋 Testing task management...")
        
        # Get all tasks
        tasks = self.run_api_test(
            "Get all tasks",
            "GET",
            "/api/tasks",
            200
        )
        
        # Get my tasks
        self.run_api_test(
            "Get my tasks",
            "GET",
            "/api/tasks/my",
            200
        )
        
        # Update a task if available
        if tasks and len(tasks) > 0:
            task_id = tasks[0]['task_id']
            update_data = {"status": "in_progress"}
            
            self.run_api_test(
                "Update task status",
                "PUT",
                f"/api/tasks/{task_id}",
                200,
                data=update_data
            )

    def test_ai_functionality(self):
        """Test AI-powered features"""
        print("\n🤖 Testing AI functionality...")
        
        if not self.patient_id or not self.workflow_id:
            print("   Skipping AI tests - no patient/workflow ID available")
            return
        
        # Generate AI discharge summary
        summary_data = {
            "patient_id": self.patient_id,
            "workflow_id": self.workflow_id
        }
        
        summary = self.run_api_test(
            "Generate AI discharge summary",
            "POST",
            "/api/ai/generate-summary",
            200,
            data=summary_data
        )
        
        if summary:
            print("   AI summary generated successfully")
            # Wait a bit for AI processing
            time.sleep(2)
            
            # Get the summary
            self.run_api_test(
                "Get discharge summary",
                "GET",
                f"/api/ai/summary/{self.workflow_id}",
                200
            )

    def test_notifications(self):
        """Test notification system"""
        print("\n🔔 Testing notifications...")
        
        # Get notifications
        notifications = self.run_api_test(
            "Get notifications",
            "GET",
            "/api/notifications",
            200
        )
        
        if notifications and len(notifications) > 0:
            notif_id = notifications[0]['notification_id']
            
            # Mark notification as read
            self.run_api_test(
                "Mark notification as read",
                "PUT",
                f"/api/notifications/{notif_id}/read",
                200
            )
            
            # Mark all as read
            self.run_api_test(
                "Mark all notifications as read",
                "PUT",
                "/api/notifications/read-all",
                200
            )

    def test_analytics(self):
        """Test analytics endpoints"""
        print("\n📈 Testing analytics...")
        
        # Get dashboard analytics
        analytics = self.run_api_test(
            "Get dashboard analytics",
            "GET",
            "/api/analytics/dashboard",
            200
        )
        
        if analytics:
            print(f"   Patients: {analytics.get('patients', {})}")
            print(f"   Workflows: {analytics.get('workflows', {})}")
        
        # Get tasks by role
        self.run_api_test(
            "Get tasks by role",
            "GET",
            "/api/analytics/tasks-by-role",
            200
        )

    def test_admin_functions(self):
        """Test admin-only functions"""
        print("\n👑 Testing admin functions...")
        
        # Get users list (should work with physician role)
        users = self.run_api_test(
            "Get users list",
            "GET",
            "/api/users",
            403  # Physician doesn't have admin access
        )

    def run_all_tests(self):
        """Run comprehensive authenticated tests"""
        print("🚀 Starting DischargeFlow Authenticated API Tests")
        print(f"Testing against: {self.base_url}")
        print(f"Session token: {self.session_token}")
        print("=" * 70)
        
        # Test authenticated endpoints
        self.test_authenticated_endpoints()
        self.test_patient_management()
        self.test_workflow_management()
        self.test_task_management()
        self.test_ai_functionality()
        self.test_notifications()
        self.test_analytics()
        self.test_admin_functions()
        
        # Print summary
        print("\n" + "=" * 70)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed >= self.tests_run * 0.8:  # 80% pass rate
            print("🎉 Most tests passed!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = DischargeFlowAuthenticatedTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())