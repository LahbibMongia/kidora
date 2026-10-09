import asset_assets_img_bgg_png from "assets/img/bgg.png";
import React from "react";
import { Switch, Route, Redirect } from "react-router-dom";

// components

import Navbar from "components/Navbars/AuthNavbar.jsx";
import FooterSmall from "components/Footers/FooterSmall.jsx";

// views

import Login from "views/auth/Login.jsx";
import forget from "views/auth/forget";
import Register from "views/auth/Register.jsx";

export default function Auth() {
  return (
    <>
      <Navbar transparent />
      <main>
        <section className="relative w-full h-full py-40 min-h-screen">
          <div
            className="absolute top-0 w-full h-full bg-blueGray-900 bg-no-repeat bg-full"
            style={{
              backgroundImage:
                "url(" + asset_assets_img_bgg_png + ")",
            }}
          ></div>
          <Switch>
            <Route path="/auth/login" exact component={Login} />
            <Route path="/auth/forget" exact component={forget} />
            <Route path="/auth/register" exact component={Register} />
            <Redirect from="/auth" to="/auth/login" />
          </Switch>
          <FooterSmall absolute />
        </section>
      </main>
    </>
  );
}
