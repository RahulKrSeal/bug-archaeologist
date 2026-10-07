// =========================================================
// BUG ARCHAEOLOGIST - FRONTEND SCRIPT
// =========================================================
//
// Handles:
//
// 1. Sign In / Sign Up switching
// 2. Login
// 3. Registration
// 4. Email verification request
// 5. Verified email state
// 6. Password visibility
// 7. JWT access token storage
// 8. JWT refresh token storage
// 9. Dashboard authentication
// 10. Logout
// 11. Verification redirect handling
//
// =========================================================


// =========================================================
// API CONFIGURATION
// =========================================================

// FastAPI backend.
const API_BASE_URL = "http://127.0.0.1:8000";

// Frontend login page.
const FRONTEND_LOGIN_URL =
    "http://127.0.0.1:3000/frontend/login.html";

// Frontend dashboard page.
const FRONTEND_DASHBOARD_URL =
    "http://127.0.0.1:3000/frontend/dashboard.html";


// =========================================================
// STORAGE KEYS
// =========================================================

const ACCESS_TOKEN_KEY =
    "bug_archaeologist_access_token";

const REFRESH_TOKEN_KEY =
    "bug_archaeologist_refresh_token";

// We store only the verified email.
// We NEVER store the email-verification JWT.
const VERIFIED_EMAIL_STORAGE_KEY =
    "bug_archaeologist_verified_email";


// =========================================================
// COMMON HELPERS
// =========================================================

function getElement(id) {
    return document.getElementById(id);
}


// =========================================================
// GENERAL STATUS MESSAGE
// =========================================================

function showStatus(message, type = "info") {

    const statusMessage =
        getElement("status-message");

    if (!statusMessage) {
        return;
    }

    statusMessage.textContent = message;

    statusMessage.className =
        "status-message";

    statusMessage.classList.add(type);

    statusMessage.hidden = false;
}


function clearStatus() {

    const statusMessage =
        getElement("status-message");

    if (!statusMessage) {
        return;
    }

    statusMessage.textContent = "";

    statusMessage.className =
        "status-message";

    statusMessage.hidden = true;
}


// =========================================================
// BUTTON LOADING STATE
// =========================================================

function setButtonLoading(
    button,
    loading,
    normalText,
    loadingText
) {

    if (!button) {
        return;
    }

    const buttonText =
        button.querySelector(".button-text");

    const buttonLoader =
        button.querySelector(".button-loader");


    if (loading) {

        button.disabled = true;

        if (buttonText) {
            buttonText.hidden = true;
        }

        if (buttonLoader) {
            buttonLoader.textContent =
                loadingText;

            buttonLoader.hidden = false;
        }

        return;
    }


    if (buttonText) {

        buttonText.textContent =
            normalText;

        buttonText.hidden = false;
    }


    if (buttonLoader) {
        buttonLoader.hidden = true;
    }
}


// =========================================================
// AUTH MODE ELEMENTS
// =========================================================

const authLayout =
    getElement("auth-layout");

const signInNavigation =
    getElement("nav-sign-in");

const signUpNavigation =
    getElement("nav-sign-up");

const inlineSignUp =
    getElement("inline-sign-up");

const inlineSignIn =
    getElement("inline-sign-in");


// =========================================================
// AUTH MODE SWITCHING
// =========================================================

function showSignIn() {

    if (!authLayout) {
        return;
    }

    authLayout.classList.remove(
        "signup-mode"
    );


    if (signInNavigation) {

        signInNavigation.classList.add(
            "active"
        );
    }


    if (signUpNavigation) {

        signUpNavigation.classList.remove(
            "active"
        );
    }


    clearStatus();
}


function showSignUp() {

    if (!authLayout) {
        return;
    }

    authLayout.classList.add(
        "signup-mode"
    );


    if (signInNavigation) {

        signInNavigation.classList.remove(
            "active"
        );
    }


    if (signUpNavigation) {

        signUpNavigation.classList.add(
            "active"
        );
    }


    clearStatus();

    // Restore the verified email only when
    // there is a valid stored verification.
    restoreVerifiedEmailState();
}


if (signInNavigation) {

    signInNavigation.addEventListener(
        "click",
        showSignIn
    );
}


if (signUpNavigation) {

    signUpNavigation.addEventListener(
        "click",
        showSignUp
    );
}


if (inlineSignUp) {

    inlineSignUp.addEventListener(
        "click",
        showSignUp
    );
}


if (inlineSignIn) {

    inlineSignIn.addEventListener(
        "click",
        showSignIn
    );
}


// =========================================================
// PASSWORD VISIBILITY
// =========================================================

const passwordToggles =
    document.querySelectorAll(
        ".password-toggle"
    );


passwordToggles.forEach(
    function (toggle) {

        toggle.addEventListener(
            "click",
            function () {

                const targetId =
                    toggle.dataset.target;

                const passwordInput =
                    getElement(targetId);


                if (!passwordInput) {
                    return;
                }


                if (
                    passwordInput.type ===
                    "password"
                ) {

                    passwordInput.type =
                        "text";

                    toggle.textContent =
                        "Hide";

                    toggle.setAttribute(
                        "aria-label",
                        "Hide password"
                    );

                } else {

                    passwordInput.type =
                        "password";

                    toggle.textContent =
                        "Show";

                    toggle.setAttribute(
                        "aria-label",
                        "Show password"
                    );
                }
            }
        );
    }
);


// =========================================================
// SIGN IN ELEMENTS
// =========================================================

const loginForm =
    getElement("login-form");

const loginEmailInput =
    getElement("login-email");

const loginPasswordInput =
    getElement("login-password");

const loginButton =
    getElement("login-button");


// =========================================================
// SIGN UP ELEMENTS
// =========================================================

const registerForm =
    getElement("register-form");

const registerEmailInput =
    getElement("register-email");

const registerUsernameInput =
    getElement("register-username");

const registerPasswordInput =
    getElement("register-password");

const verifyEmailButton =
    getElement("verify-email-button");

const registerButton =
    getElement("register-button");

const verificationStatus =
    getElement(
        "email-verification-status"
    );


// =========================================================
// VERIFICATION STATE
// =========================================================

// This belongs only to the current browser page.
let emailVerified = false;


// =========================================================
// VERIFIED EMAIL STORAGE
// =========================================================

function getStoredVerifiedEmail() {

    return localStorage.getItem(
        VERIFIED_EMAIL_STORAGE_KEY
    );
}


function storeVerifiedEmail(email) {

    const cleanEmail =
        email.trim().toLowerCase();

    if (!cleanEmail) {
        return;
    }

    localStorage.setItem(
        VERIFIED_EMAIL_STORAGE_KEY,
        cleanEmail
    );
}


function clearStoredVerifiedEmail() {

    localStorage.removeItem(
        VERIFIED_EMAIL_STORAGE_KEY
    );
}


// =========================================================
// TOKEN STORAGE
// =========================================================

function storeTokens(
    accessToken,
    refreshToken
) {

    if (accessToken) {

        localStorage.setItem(
            ACCESS_TOKEN_KEY,
            accessToken
        );
    }


    if (refreshToken) {

        localStorage.setItem(
            REFRESH_TOKEN_KEY,
            refreshToken
        );
    }
}


function getAccessToken() {

    return localStorage.getItem(
        ACCESS_TOKEN_KEY
    );
}


function getRefreshToken() {

    return localStorage.getItem(
        REFRESH_TOKEN_KEY
    );
}


function clearTokens() {

    localStorage.removeItem(
        ACCESS_TOKEN_KEY
    );

    localStorage.removeItem(
        REFRESH_TOKEN_KEY
    );
}


// =========================================================
// EMAIL VERIFICATION STATUS
// =========================================================

function showVerificationStatus(
    message,
    type = "info"
) {

    if (!verificationStatus) {
        return;
    }

    verificationStatus.textContent =
        message;

    verificationStatus.className =
        "email-verification-status";

    verificationStatus.classList.add(type);

    verificationStatus.hidden = false;
}


function clearVerificationStatus() {

    if (!verificationStatus) {
        return;
    }

    verificationStatus.textContent = "";

    verificationStatus.className =
        "email-verification-status";

    verificationStatus.hidden = true;
}


// =========================================================
// EMAIL VALIDATION
// =========================================================

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );
}


// =========================================================
// UPDATE VERIFY BUTTON
// =========================================================

function updateVerifyButton() {

    if (!verifyEmailButton) {
        return;
    }


    // -----------------------------------------------------
    // Email is already verified.
    // -----------------------------------------------------

    if (emailVerified) {

        verifyEmailButton.disabled = true;

        const buttonText =
            verifyEmailButton.querySelector(
                ".button-text"
            );

        const buttonLoader =
            verifyEmailButton.querySelector(
                ".button-loader"
            );


        if (buttonText) {

            buttonText.textContent =
                "Verified ✓";

            buttonText.hidden = false;
        }


        if (buttonLoader) {
            buttonLoader.hidden = true;
        }

        return;
    }


    // -----------------------------------------------------
    // Read current email.
    // -----------------------------------------------------

    const email =
        registerEmailInput
            ? registerEmailInput.value
                .trim()
                .toLowerCase()
            : "";


    // -----------------------------------------------------
    // Invalid email.
    // -----------------------------------------------------

    if (!isValidEmail(email)) {

        verifyEmailButton.disabled = true;

        const buttonText =
            verifyEmailButton.querySelector(
                ".button-text"
            );

        if (buttonText) {

            buttonText.textContent =
                "Verify";

            buttonText.hidden = false;
        }

        return;
    }


    // -----------------------------------------------------
    // Valid email.
    // -----------------------------------------------------

    verifyEmailButton.disabled = false;

    const buttonText =
        verifyEmailButton.querySelector(
            ".button-text"
        );

    if (buttonText) {

        buttonText.textContent =
            "Verify";

        buttonText.hidden = false;
    }
}


// =========================================================
// UPDATE REGISTER BUTTON
// =========================================================

function updateRegisterButton() {

    if (!registerButton) {
        return;
    }


    // Account creation is allowed only
    // after successful email verification.
    registerButton.disabled =
        !emailVerified;
}


// =========================================================
// APPLY VERIFIED EMAIL STATE
// =========================================================

function applyVerifiedEmailState(email) {

    if (!registerEmailInput) {
        return;
    }


    const cleanEmail =
        email.trim().toLowerCase();


    if (!isValidEmail(cleanEmail)) {
        return;
    }


    // Mark this email as verified.
    emailVerified = true;


    // Put the verified email into the form.
    registerEmailInput.value =
        cleanEmail;


    // Prevent changing the verified email.
    registerEmailInput.readOnly =
        true;


    // Store only the email.
    // The verification JWT is never stored.
    storeVerifiedEmail(
        cleanEmail
    );


    updateVerifyButton();

    updateRegisterButton();


    showVerificationStatus(
        "Email verified successfully. You can now create your account.",
        "success"
    );
}


// =========================================================
// RESTORE VERIFIED EMAIL STATE
// =========================================================

function restoreVerifiedEmailState() {

    if (!registerEmailInput) {
        return;
    }


    const storedEmail =
        getStoredVerifiedEmail();


    // Nothing was previously verified.
    if (!storedEmail) {

        emailVerified = false;

        registerEmailInput.readOnly =
            false;

        updateVerifyButton();

        updateRegisterButton();

        return;
    }


    const currentEmail =
        registerEmailInput.value
            .trim()
            .toLowerCase();


    // If the user typed another email,
    // do not silently replace it.
    if (
        currentEmail &&
        currentEmail !== storedEmail
    ) {

        emailVerified = false;

        registerEmailInput.readOnly =
            false;

        updateVerifyButton();

        updateRegisterButton();

        return;
    }


    // Restore the previously verified email.
    applyVerifiedEmailState(
        storedEmail
    );
}


// =========================================================
// HANDLE VERIFICATION REDIRECT
// =========================================================
//
// Expected final URL:
//
// login.html?verified_email=user@example.com
//
// The email is immediately removed from the
// browser URL after being stored.
//
// =========================================================

function handleVerificationRedirect() {

    if (!registerEmailInput) {
        return false;
    }


    const urlParams =
        new URLSearchParams(
            window.location.search
        );


    const verifiedEmail =
        urlParams.get(
            "verified_email"
        );


    if (!verifiedEmail) {
        return false;
    }


    const cleanEmail =
        verifiedEmail
            .trim()
            .toLowerCase();


    if (!isValidEmail(cleanEmail)) {
        return false;
    }


    // Store verified email.
    storeVerifiedEmail(
        cleanEmail
    );


    // Switch to Sign Up.
    showSignUp();


    // Apply verified state.
    applyVerifiedEmailState(
        cleanEmail
    );


    // Remove query parameters from the URL.
    window.history.replaceState(
        {},
        document.title,
        window.location.pathname
    );


    return true;
}


// =========================================================
// EMAIL INPUT CHANGE
// =========================================================

if (registerEmailInput) {

    registerEmailInput.addEventListener(
        "input",
        function () {

            const currentEmail =
                registerEmailInput.value
                    .trim()
                    .toLowerCase();


            const storedEmail =
                getStoredVerifiedEmail();


            // If the email changes away from the
            // verified email, verification is lost.
            if (
                !storedEmail ||
                currentEmail !== storedEmail
            ) {

                emailVerified = false;

                registerEmailInput.readOnly =
                    false;

                clearVerificationStatus();

                updateVerifyButton();

                updateRegisterButton();
            }
        }
    );
}


// =========================================================
// REQUEST EMAIL VERIFICATION
// =========================================================

if (verifyEmailButton) {

    verifyEmailButton.addEventListener(
        "click",
        async function () {

            const email =
                registerEmailInput
                    ? registerEmailInput.value
                        .trim()
                        .toLowerCase()
                    : "";


            // -------------------------------------------------
            // Validate email.
            // -------------------------------------------------

            if (!isValidEmail(email)) {

                showVerificationStatus(
                    "Please enter a valid email address first.",
                    "error"
                );

                updateVerifyButton();

                return;
            }


            // -------------------------------------------------
            // Loading state.
            // -------------------------------------------------

            setButtonLoading(
                verifyEmailButton,
                true,
                "Verify",
                "Sending..."
            );


            showVerificationStatus(
                "Sending verification email...",
                "info"
            );


            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/auth/request-verification`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email: email
                            })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.detail ||
                        "Unable to send verification email."
                    );
                }


                // Email was successfully sent.
                const buttonText =
                    verifyEmailButton.querySelector(
                        ".button-text"
                    );

                const buttonLoader =
                    verifyEmailButton.querySelector(
                        ".button-loader"
                    );


                if (buttonText) {

                    buttonText.textContent =
                        "Sent ✓";

                    buttonText.hidden =
                        false;
                }


                if (buttonLoader) {
                    buttonLoader.hidden =
                        true;
                }


                verifyEmailButton.disabled =
                    true;


                showVerificationStatus(
                    "Verification email sent. Check your inbox and click the verification link.",
                    "success"
                );


            } catch (error) {

                console.error(
                    "Verification email error:",
                    error
                );


                showVerificationStatus(
                    error.message ||
                    "Unable to send verification email.",
                    "error"
                );


                updateVerifyButton();


            } finally {

                const buttonLoader =
                    verifyEmailButton.querySelector(
                        ".button-loader"
                    );


                if (buttonLoader) {
                    buttonLoader.hidden =
                        true;
                }
            }
        }
    );
}


// =========================================================
// REGISTRATION
// =========================================================

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            // Prevent normal HTML form submission.
            event.preventDefault();


            clearStatus();


            // -------------------------------------------------
            // Read form values.
            // -------------------------------------------------

            const email =
                registerEmailInput
                    ? registerEmailInput.value
                        .trim()
                        .toLowerCase()
                    : "";

            const username =
                registerUsernameInput
                    ? registerUsernameInput.value
                        .trim()
                    : "";

            const password =
                registerPasswordInput
                    ? registerPasswordInput.value
                    : "";


            // -------------------------------------------------
            // Verification check.
            // -------------------------------------------------

            if (!emailVerified) {

                showVerificationStatus(
                    "Please verify your email before creating an account.",
                    "error"
                );

                return;
            }


            // -------------------------------------------------
            // Basic frontend validation.
            // -------------------------------------------------

            if (!isValidEmail(email)) {

                showVerificationStatus(
                    "Please enter a valid email address.",
                    "error"
                );

                return;
            }


            if (!username) {

                showVerificationStatus(
                    "Please enter a username.",
                    "error"
                );

                return;
            }


            if (!password) {

                showVerificationStatus(
                    "Please enter a password.",
                    "error"
                );

                return;
            }


            // -------------------------------------------------
            // Registration loading state.
            // -------------------------------------------------

            setButtonLoading(
                registerButton,
                true,
                "Create Account",
                "Creating account..."
            );


            showVerificationStatus(
                "Creating your Bug Archaeologist account...",
                "info"
            );


            try {

                // -------------------------------------------------
                // Send registration request to FastAPI.
                // -------------------------------------------------

                const response =
                    await fetch(
                        `${API_BASE_URL}/auth/register`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email: email,
                                username: username,
                                password: password
                            })
                        }
                    );


                const data =
                    await response.json();


                // -------------------------------------------------
                // Backend rejected registration.
                // -------------------------------------------------

                if (!response.ok) {

                    let message =
                        "Unable to create account.";

                    if (
                        typeof data.detail ===
                        "string"
                    ) {

                        message =
                            data.detail;

                    } else if (
                        Array.isArray(
                            data.detail
                        )
                    ) {

                        message =
                            data.detail
                                .map(
                                    item =>
                                        item.msg
                                )
                                .join(", ");
                    }


                    throw new Error(
                        message
                    );
                }


                // -------------------------------------------------
                // Registration succeeded.
                // -------------------------------------------------

                // The verified email is no longer needed
                // because the account now exists.
                clearStoredVerifiedEmail();

                emailVerified = false;


                // Clear registration fields.
                if (registerEmailInput) {
                    registerEmailInput.value =
                        "";
                    registerEmailInput.readOnly =
                        false;
                }

                if (registerUsernameInput) {
                    registerUsernameInput.value =
                        "";
                }

                if (registerPasswordInput) {
                    registerPasswordInput.value =
                        "";
                }


                updateVerifyButton();

                updateRegisterButton();

                clearVerificationStatus();


                // Show Sign In page.
                showSignIn();


                showStatus(
                    "Account created successfully. Please sign in.",
                    "success"
                );


            } catch (error) {

                console.error(
                    "Registration error:",
                    error
                );


                // IMPORTANT:
                // Do NOT switch to Sign In when registration
                // fails. Stay on Sign Up so the user can fix it.

                showVerificationStatus(
                    error.message ||
                    "Unable to create account.",
                    "error"
                );


            } finally {

                setButtonLoading(
                    registerButton,
                    false,
                    "Create Account",
                    "Creating account..."
                );


                // Restore the disabled state based
                // on actual verification state.
                updateRegisterButton();
            }
        }
    );
}


// =========================================================
// LOGIN
// =========================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            // Prevent normal browser form submission.
            event.preventDefault();


            clearStatus();


            const email =
                loginEmailInput
                    ? loginEmailInput.value
                        .trim()
                        .toLowerCase()
                    : "";

            const password =
                loginPasswordInput
                    ? loginPasswordInput.value
                    : "";


            if (!email || !password) {

                showStatus(
                    "Please enter your email and password.",
                    "error"
                );

                return;
            }


            setButtonLoading(
                loginButton,
                true,
                "Enter Workspace",
                "Authenticating..."
            );


            showStatus(
                "Authenticating...",
                "info"
            );


            try {

                // -------------------------------------------------
                // Login request.
                // -------------------------------------------------

                const response =
                    await fetch(
                        `${API_BASE_URL}/auth/login`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email: email,
                                password: password
                            })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.detail ||
                        "Login failed."
                    );
                }


                // -------------------------------------------------
                // Store JWT tokens.
                // -------------------------------------------------

                storeTokens(
                    data.access_token,
                    data.refresh_token
                );


                // -------------------------------------------------
                // Move to dashboard.
                // -------------------------------------------------

                window.location.href =
                    FRONTEND_DASHBOARD_URL;


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                showStatus(
                    error.message ||
                    "Unable to sign in.",
                    "error"
                );


            } finally {

                setButtonLoading(
                    loginButton,
                    false,
                    "Enter Workspace",
                    "Authenticating..."
                );
            }
        }
    );
}


// =========================================================
// REFRESH ACCESS TOKEN
// =========================================================

async function refreshAccessToken() {

    const refreshToken =
        getRefreshToken();


    if (!refreshToken) {
        return null;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/auth/refresh`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        refresh_token:
                            refreshToken
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            clearTokens();

            return null;
        }


        // Store the newly generated access token.
        if (data.access_token) {

            localStorage.setItem(
                ACCESS_TOKEN_KEY,
                data.access_token
            );
        }


        return data.access_token || null;


    } catch (error) {

        console.error(
            "Token refresh error:",
            error
        );

        clearTokens();

        return null;
    }
}


// =========================================================
// AUTHENTICATED API REQUEST
// =========================================================
//
// Sends an access token.
// If the access token has expired,
// it attempts one refresh and retries.
//
// =========================================================

async function authenticatedFetch(
    url,
    options = {}
) {

    let accessToken =
        getAccessToken();


    if (!accessToken) {
        return null;
    }


    const requestOptions = {
        ...options,

        headers: {
            ...(options.headers || {}),
            Authorization:
                `Bearer ${accessToken}`
        }
    };


    let response =
        await fetch(
            url,
            requestOptions
        );


    // ---------------------------------------------------------
    // Access token expired.
    // ---------------------------------------------------------

    if (response.status === 401) {

        accessToken =
            await refreshAccessToken();


        if (!accessToken) {

            return response;
        }


        // Retry with new access token.
        requestOptions.headers.Authorization =
            `Bearer ${accessToken}`;


        response =
            await fetch(
                url,
                requestOptions
            );
    }


    return response;
}


// =========================================================
// DASHBOARD AUTHENTICATION
// =========================================================

async function authenticateDashboard() {

    const accessToken =
        getAccessToken();


    // No access token means the user is not logged in.
    if (!accessToken) {

        window.location.href =
            FRONTEND_LOGIN_URL;

        return;
    }


    try {

        // Ask FastAPI who the current user is.
        const response =
            await authenticatedFetch(
                `${API_BASE_URL}/auth/me`,
                {
                    method: "GET"
                }
            );


        if (!response) {

            window.location.href =
                FRONTEND_LOGIN_URL;

            return;
        }


        if (!response.ok) {

            clearTokens();

            window.location.href =
                FRONTEND_LOGIN_URL;

            return;
        }


        const user =
            await response.json();


        console.log(
            "Authenticated user:",
            user
        );


    } catch (error) {

        console.error(
            "Dashboard authentication error:",
            error
        );


        clearTokens();

        window.location.href =
            FRONTEND_LOGIN_URL;
    }
}


// =========================================================
// LOGOUT
// =========================================================

const logoutButton =
    getElement("logout-button");


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            const accessToken =
                getAccessToken();


            try {

                // Tell backend that logout occurred.
                // The current backend endpoint simply
                // confirms logout.
                if (accessToken) {

                    await fetch(
                        `${API_BASE_URL}/auth/logout`,
                        {
                            method: "POST",

                            headers: {
                                Authorization:
                                    `Bearer ${accessToken}`
                            }
                        }
                    );
                }

            } catch (error) {

                console.error(
                    "Logout request error:",
                    error
                );

            } finally {

                // Always remove local JWT tokens.
                clearTokens();

                // Return to Sign In.
                window.location.href =
                    FRONTEND_LOGIN_URL;
            }
        }
    );
}


// =========================================================
// PAGE INITIALIZATION
// =========================================================

function initializePage() {

    const currentPath =
        window.location.pathname;


    // ---------------------------------------------------------
    // Dashboard page.
    // ---------------------------------------------------------

    if (
        currentPath.includes(
            "/frontend/dashboard.html"
        )
    ) {

        authenticateDashboard();

        return;
    }


    // ---------------------------------------------------------
    // Login / Sign Up page.
    // ---------------------------------------------------------

    if (
        currentPath.includes(
            "/frontend/login.html"
        )
    ) {

        // First check whether the email verification
        // flow returned a verified email.
        const redirected =
            handleVerificationRedirect();


        // If there was no verification redirect,
        // restore any existing verified email.
        if (!redirected) {

            restoreVerifiedEmailState();
        }


        updateVerifyButton();

        updateRegisterButton();
    }
}


// =========================================================
// START APPLICATION
// =========================================================

initializePage();


// =========================================================
// END OF BUG ARCHAEOLOGIST FRONTEND SCRIPT
// =========================================================