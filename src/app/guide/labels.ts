/**
 * On-screen labels the guide quotes, copied from the real pages.
 * Citizen pages may still change: edit the words here and the copy and scenes follow.
 */
export const LABELS = {
    // Header and /auth
    navReport: "Report a hazard",
    navComplaints: "Complaints",
    navDashboard: "Dashboard",
    tabLogIn: "Log in",
    tabSignUp: "Sign up",
    logInAs: "Log in as",
    roleCitizen: "Citizen",
    roleMunicipal: "Municipal staff",
    roleTraffic: "Traffic police",
    usernameOrEmail: "Username or email",
    password: "Password",
    logInButton: "Log in",
    createAccountButton: "Create account",

    // /upload and /results
    uploadTitle: "Scan a photo or video",
    lookFor: "What should the AI look for?",
    roadHazards: "Road hazards",
    trafficViolations: "Traffic violations",
    mediaPhoto: "Photo",
    mediaVideo: "Video",
    uploadPhoto: "Upload photo",
    chooseFile: "Choose file",
    scanHazards: "Scan for hazards",
    scanViolations: "Scan for violations",
    scanResult: "Scan result",
    overallPriority: "Overall priority",
    reportThisHazard: "Report this hazard",
    nothingFound: "Nothing found",
    scanFailed: "Scan failed",

    // Report form (/complaints)
    reportsTitle: "Road reports",
    whatIsProblem: "What is the problem?",
    description: "Description",
    whereIsIt: "Where is it?",
    useMyLocation: "Use my current location",
    street: "Street or area",
    city: "City",
    state: "State",
    pincode: "Pincode",
    sendReport: "Send report",

    // Status, upvotes, chat
    statusSubmitted: "Submitted",
    statusApproved: "Approved",
    statusCompleted: "Completed",
    statusRejected: "Rejected",
    statusOnHold: "On hold",
    myReports: "My reports",
    departmentRemarks: "Department remarks",
    supportChat: "Support chat",
    writeMessage: "Write a message",

    // Municipal desk
    municipalDesk: "Municipal desk",
    complaintsTitle: "Complaints",
    chats: "Chats",
    runDetection: "Run detection",
    manage: "Manage",
    updateComplaint: "Update complaint",
    status: "Status",
    approvedOption: "Approved (task created)",
    remarks: "Remarks for the citizen",
    markDuplicate: "Mark as duplicate",
    duplicateNote: "A duplicate is closed as Rejected.",
    originalReportId: "Original report ID",
    resolutionPhoto: "Resolution photo",
    uploadResolutionPhoto: "Upload resolution photo",
    saveChanges: "Save changes",
    changesSaved: "Changes saved",
    citizenChats: "Citizen chats",
    writeReply: "Write a reply",

    // Traffic desk
    trafficDesk: "Traffic desk",
    trafficTitle: "Traffic enforcement",
    recentViolations: "Recent violations",
    noHelmet: "No helmet",
    tripleRiding: "Triple riding",
    numberPlate: "Number plate",
    challanIssued: "Challan issued",
    // Not found as a button on /Traffic yet (the challan API exists); rename to match the real control.
    issueChallan: "Issue challan",
} as const;
