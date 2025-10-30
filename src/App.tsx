import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import UploadCourse from "./pages/UploadCourse";
import Calendar from "./pages/Calendar";
import Planning from "./pages/Planning";
import DailyQuiz from "./pages/DailyQuiz";
import Result from "./pages/Result";
import Messaging from "./pages/Messaging";
import Profile from "./pages/Profile";
import Progression from "./pages/Progression";
import CahierErreurs from "./pages/CahierErreurs";
import NotFound from "./pages/NotFound";
import InformationSurvey from "./pages/InformationSurvey";
import CourseDetail from "./pages/CourseDetail";
import VirtualTeacher from "./pages/VirtualTeacher";
import ProfesseurParticulierVirtuel from "./pages/ProfesseurParticulierVirtuel";
import DashboardOrganization from "./pages/DashboardOrganization";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrganizationRequests from "./pages/AdminOrganizationRequests";
import OrganizationRequestStatus from "./pages/OrganizationRequestStatus";
import StudentDocuments from "./pages/StudentDocuments";
import StudentRevisionSheets from "./pages/StudentRevisionSheets";
import RevisionSheets from "./pages/student/RevisionSheets";
import AIRevisionSession from "./pages/student/AIRevisionSession";
import Terms from "./pages/Terms"; // Import Terms page
import Privacy from "./pages/Privacy"; // Import Privacy page
import ResetPassword from "./pages/ResetPassword";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ProfileCompletionGuard } from "./components/ProfileCompletionGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ProfileCompletionGuard>
          <Routes>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/informations" element={<ProtectedRoute><InformationSurvey /></ProtectedRoute>} />

            {/* Routes Admin Savistas - Backoffice */}
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/organization-requests" element={<ProtectedRoute><AdminOrganizationRequests /></ProtectedRoute>} />

            {/* Routes B2B avec rôle dynamique */}
            <Route path="/:role/creation-request" element={<ProtectedRoute><OrganizationRequestStatus /></ProtectedRoute>} />
            <Route path="/:role/dashboard-organization" element={<ProtectedRoute><DashboardOrganization /></ProtectedRoute>} />
            <Route path="/:role/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/:role/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/:role/upload-course" element={<ProtectedRoute><UploadCourse /></ProtectedRoute>} />
            <Route path="/:role/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
            <Route path="/:role/planning" element={<ProtectedRoute><Planning /></ProtectedRoute>} />
            <Route path="/:role/daily-quiz/:id" element={<ProtectedRoute><DailyQuiz /></ProtectedRoute>} />
            <Route path="/:role/result/:id" element={<ProtectedRoute><Result /></ProtectedRoute>} />
            <Route path="/:role/messaging" element={<ProtectedRoute><Messaging /></ProtectedRoute>} />
            <Route path="/:role/progression" element={<ProtectedRoute><Progression /></ProtectedRoute>} />
            <Route path="/:role/cahier-erreurs" element={<ProtectedRoute><CahierErreurs /></ProtectedRoute>} />
            <Route path="/:role/courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
            <Route path="/:role/professeur-virtuel" element={<ProtectedRoute><VirtualTeacher /></ProtectedRoute>} />
            <Route path="/:role/professeur-particulier-virtuel" element={<ProtectedRoute><ProfesseurParticulierVirtuel /></ProtectedRoute>} />
            <Route path="/:role/documents" element={<ProtectedRoute><StudentDocuments /></ProtectedRoute>} />
            <Route path="/:role/revision-sheets" element={<ProtectedRoute><StudentRevisionSheets /></ProtectedRoute>} />

            {/* New Revision Sheets Routes */}
            <Route path="/student/revision-sheets" element={<ProtectedRoute><RevisionSheets /></ProtectedRoute>} />
            <Route path="/student/revision-sheets/:courseId/ai-session" element={<ProtectedRoute><AIRevisionSession /></ProtectedRoute>} />

            {/* Routes legacy (sans rôle) pour rétrocompatibilité */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/upload-course" element={<ProtectedRoute><UploadCourse /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
            <Route path="/planning" element={<ProtectedRoute><Planning /></ProtectedRoute>} />
            <Route path="/daily-quiz/:id" element={<ProtectedRoute><DailyQuiz /></ProtectedRoute>} />
            <Route path="/result/:id" element={<ProtectedRoute><Result /></ProtectedRoute>} />
            <Route path="/messaging" element={<ProtectedRoute><Messaging /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/progression" element={<ProtectedRoute><Progression /></ProtectedRoute>} />
            <Route path="/cahier-erreurs" element={<ProtectedRoute><CahierErreurs /></ProtectedRoute>} />
            <Route path="/courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
            <Route path="/professeur-virtuel" element={<ProtectedRoute><VirtualTeacher /></ProtectedRoute>} />
            <Route path="/professeur-particulier-virtuel" element={<ProtectedRoute><ProfesseurParticulierVirtuel /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><StudentDocuments /></ProtectedRoute>} />
            <Route path="/revision-sheets" element={<ProtectedRoute><StudentRevisionSheets /></ProtectedRoute>} />
            <Route path="/terms" element={<Terms />} /> {/* Add Terms route */}
            <Route path="/privacy" element={<Privacy />} /> {/* Add Privacy route */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ProfileCompletionGuard>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
