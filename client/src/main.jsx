import React from "react";
import ReactDOM from "react-dom/client";
import AppRoutes from "./routes/AppRoutes.jsx";
import { Provider } from "react-redux";
import { store } from "./app/store";
import './index.css'
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from '@react-oauth/google';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// import './assets/css/bootstrap.min.css'
// import './assets/css/style.css'
// import './assets/css/iconsax.css';
// import './assets/plugins/feather/feather.css';
// import './assets/plugins/fontawesome/css/all.min.css';
// import './assets/plugins/fontawesome/css/fontawesome.min.css';
// import './assets/plugins/select2/css/select2.min.css';
// import './assets/plugins/slick/slick.css';
// import './assets/plugins/slick/slick-theme.css';
// import './assets/plugins/tabler-icons/tabler-icons.css';


import App from './App.jsx'

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <Provider store={store}>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: "rounded-xl shadow-lg",
        }}
      />
    </Provider>
  </GoogleOAuthProvider>
);
