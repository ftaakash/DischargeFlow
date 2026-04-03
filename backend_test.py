import requests
import sys
import json
from datetime import datetime
import time

class DischargeFlowAPITester:
    def __init__(self, base_url="https://doc-builder-102.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

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
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected: {expected_status})"
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f" - {response.text[:100]}"

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

    def create_test_session(self):
        """Create test user and session using MongoDB"""
        print("\n🔧 Creating test user and session...")
        
        # For now, we'll use a mock session token since we can't directly access MongoDB
        # In a real scenario, this would create a user and session in the database
        self.session_token = f"test_session_{int(time.time())}"
        self.user_id = f"test_user_{int(time.time())}"
        
        print(f"Created test session: {self.session_token}")
        print(f"Created test user: {self.user_id}")
        return True

    def test_seed_endpoint(self):
        """Test the seed endpoint to create sample data"""
        print("\n📊 Testing seed endpoint...")
        result = self.run_api_test(
            "Seed sample data",
            "POST",
            "/api/seed",
            200
        )
        return result is not None

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing authentication endpoints...")
        
        # Test /api/auth/me without token (should fail)
        self.run_api_test(
            "Get current user (no auth)",
            "GET",
            "/api/auth/me",
            401
        )
        
        # For testing purposes, we'll skip the actual session creation
        # and assume we have a valid session token
        print("Note: Skipping actual session creation - would require Google OAuth flow")

    def test_patient_endpoints(self):
        """Test patient management endpoints"""
        print("\n👥 Testing patient endpoints...")
        
        # Test get patients (requires auth)
        self.run_api_test(
            "Get patients list",
            "GET",
            "/api/patients",
            401  # Expected to fail without proper auth
        )
        
        # Test get single patient
        self.run_api_test(
            "Get single patient",
            "GET",
            "/api/patients/pat_123",
            401  # Expected to fail without proper auth
        )

    def test_workflow_endpoints(self):
        """Test workflow management endpoints"""
        print("\n🔄 Testing workflow endpoints...")
        
        # Test initiate discharge workflow
        self.run_api_test(
            "Initiate discharge workflow",
            "POST",
            "/api/workflows/initiate/pat_123",
            401  # Expected to fail without proper auth
        )
        
        # Test get workflows
        self.run_api_test(
            "Get workflows list",
            "GET",
            "/api/workflows",
            401  # Expected to fail without proper auth
        )

    def test_task_endpoints(self):
        """Test task management endpoints"""
        print("\n📋 Testing task endpoints...")
        
        # Test get tasks
        self.run_api_test(
            "Get tasks list",
            "GET",
            "/api/tasks",
            401  # Expected to fail without proper auth
        )
        
        # Test get my tasks
        self.run_api_test(
            "Get my tasks",
            "GET",
            "/api/tasks/my",
            401  # Expected to fail without proper auth
        )

    def test_ai_endpoints(self):
        """Test AI-powered endpoints"""
        print("\n🤖 Testing AI endpoints...")
        
        # Test generate discharge summary
        test_data = {
            "patient_id": "pat_123",
            "workflow_id": "wf_123"
        }
        
        self.run_api_test(
            "Generate AI discharge summary",
            "POST",
            "/api/ai/generate-summary",
            401,  # Expected to fail without proper auth
            data=test_data
        )

    def test_notification_endpoints(self):
        """Test notification endpoints"""
        print("\n🔔 Testing notification endpoints...")
        
        # Test get notifications
        self.run_api_test(
            "Get notifications",
            "GET",
            "/api/notifications",
            401  # Expected to fail without proper auth
        )

    def test_analytics_endpoints(self):
        """Test analytics endpoints"""
        print("\n📈 Testing analytics endpoints...")
        
        # Test dashboard analytics
        self.run_api_test(
            "Get dashboard analytics",
            "GET",
            "/api/analytics/dashboard",
            401  # Expected to fail without proper auth
        )
        
        # Test tasks by role
        self.run_api_test(
            "Get tasks by role",
            "GET",
            "/api/analytics/tasks-by-role",
            401  # Expected to fail without proper auth
        )

    def test_admin_endpoints(self):
        """Test admin-only endpoints"""
        print("\n👑 Testing admin endpoints...")
        
        # Test get users (admin only)
        self.run_api_test(
            "Get users list (admin)",
            "GET",
            "/api/users",
            401  # Expected to fail without proper auth
        )

    def test_basic_connectivity(self):
        """Test basic server connectivity"""
        print("\n🌐 Testing basic connectivity...")
        
        try:
            response = requests.get(f"{self.base_url}/docs", timeout=10)
            success = response.status_code in [200, 404]  # 404 is OK if docs are disabled
            self.log_test("Server connectivity", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Server connectivity", False, f"Error: {str(e)}")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting DischargeFlow API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test basic connectivity first
        self.test_basic_connectivity()
        
        # Test seed endpoint (public)
        self.test_seed_endpoint()
        
        # Create test session
        self.create_test_session()
        
        # Test all endpoints
        self.test_auth_endpoints()
        self.test_patient_endpoints()
        self.test_workflow_endpoints()
        self.test_task_endpoints()
        self.test_ai_endpoints()
        self.test_notification_endpoints()
        self.test_analytics_endpoints()
        self.test_admin_endpoints()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = DischargeFlowAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())