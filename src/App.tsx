import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import UploadCourse from "./pages/UploadCourse";
import Calendar from "./pages/Calendar";
import Planning from "./pages/Planning";
import DailyQuiz from "./pages/DailyQuiz";
import Result from "./pages/Result";
import Messaging from "./pages/Messaging";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import InformationSurvey from "./pages/InformationSurvey";
import CourseDetail from "./pages/CourseDetail";
import Terms from "./pages/Terms"; // Import Terms page
import Privacy from "./pages/Privacy"; // Import Privacy page
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
            <Route path="/" element={<Welcome />} />
            <Route path="/welcome" element={<Welcome />} />

            <Route path="/auth" element={<Auth />} />
            <Route path="/informations" element={<ProtectedRoute><InformationSurvey /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/upload-course" element={<ProtectedRoute><UploadCourse /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
            <Route path="/planning" element={<ProtectedRoute><Planning /></ProtectedRoute>} />
            <Route path="/daily-quiz/:id" element={<ProtectedRoute><DailyQuiz /></ProtectedRoute>} />
            <Route path="/result/:id" element={<ProtectedRoute><Result /></ProtectedRoute>} />
            <Route path="/messaging" element={<ProtectedRoute><Messaging /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
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
