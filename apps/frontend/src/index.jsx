import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Switch, Redirect } from "react-router-dom";

import "@fortawesome/fontawesome-free/css/all.min.css";
import "assets/styles/tailwind.css";

// context & guards
import { AuthProvider } from "context/AuthContext.jsx";
import ProtectedRoute from "components/ProtectedRoute.jsx";


// layouts
import Admin from "layouts/Admin.jsx";
import Auth from "layouts/Auth.jsx";

// views without layouts
import Landing from "views/Landing.jsx";
import Profile from "views/Profile.jsx";
import ProfileBs from "views/auth/Profile-bs.jsx";
import EditProfileBs from "views/auth/EditProfile-bs.jsx";
import Index from "views/Index.jsx";
import Booking from "views/auth/booking.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <Switch>
        {/* add routes with layouts */}
        <ProtectedRoute path="/admin" component={Admin} adminOnly />
        <ProtectedRoute path="/auth/booking" exact component={Booking} allowedRoles={["parent"]} />
        <Route path="/auth" component={Auth} />
        {/* add routes without layouts */}
        <Route path="/landing" exact component={Landing} />
        <ProtectedRoute path="/profile" exact component={Profile} />
        <ProtectedRoute path="/profile-bs" exact component={ProfileBs} />
        <ProtectedRoute path="/edit-profile-bs" exact component={EditProfileBs} />
        <Route path="/" exact component={Index} />
        {/* add redirect for first page */}
        <Redirect from="*" to="/" />
      </Switch>
    </AuthProvider>
  </BrowserRouter>,
);
