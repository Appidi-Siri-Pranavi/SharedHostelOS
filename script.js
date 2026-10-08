// ==========================================
// SHARED HOSTEL RESOURCE MANAGEMENT SYSTEM
// Operating Systems Mini Project
// ==========================================


// ==========================================
// SETTINGS
// ==========================================

// Maximum number of resources one student can hold
const MAX_RESOURCES_PER_STUDENT = 2;

// Resource usage time limit
// Change 30 to 60 if you want 60 seconds
const RESOURCE_TIME_LIMIT = 30;

// Starvation warning time
const STARVATION_LIMIT = 15;


// ==========================================
// RESOURCES
// ==========================================

let resources = [
    {
        name: "Washing Machine",
        total: 1,
        available: 1
    },

    {
        name: "Dryer",
        total: 1,
        available: 1
    },

    {
        name: "Iron",
        total: 1,
        available: 1
    },

    {
        name: "Study Room",
        total: 1,
        available: 1
    },

    {
        name: "Charging Point",
        total: 2,
        available: 2
    }
];


// ==========================================
// WAITING QUEUE
// ==========================================

let waitingRequests = [];


// ==========================================
// CURRENT ALLOCATIONS
// ==========================================

let allocations = [];


// ==========================================
// SEMAPHORE
// ==========================================

class Semaphore {

    constructor(count) {
        this.count = count;
    }

    acquire() {

        if (this.count > 0) {
            this.count--;
            return true;
        }

        return false;
    }

    release() {
        this.count++;
    }
}


// Charging Point has 2 instances
let chargingSemaphore = new Semaphore(2);


// ==========================================
// COUNT RESOURCES HELD BY STUDENT
// ==========================================

function countStudentResources(student) {

    return allocations.filter(
        item => item.student === student
    ).length;
}


// ==========================================
// REQUEST RESOURCE
// ==========================================

function requestResource() {

    const student =
        document.getElementById("studentSelect").value;

    const resource =
        document.getElementById("resourceSelect").value;


    // Check maximum resource limit

    if (countStudentResources(student) >= MAX_RESOURCES_PER_STUDENT) {

        alert(
            student +
            " already holds the maximum of " +
            MAX_RESOURCES_PER_STUDENT +
            " resources."
        );

        return;
    }


    // Check if student already has this resource

    const alreadyAllocated = allocations.some(
        item =>
            item.student === student &&
            item.resource === resource
    );

    if (alreadyAllocated) {

        alert(
            student +
            " already has " +
            resource
        );

        return;
    }


    // Check if student is already waiting

    const alreadyWaiting = waitingRequests.some(
        item =>
            item.student === student &&
            item.resource === resource
    );

    if (alreadyWaiting) {

        alert(
            student +
            " is already waiting for " +
            resource
        );

        return;
    }


    // Find resource

    const resourceData = resources.find(
        item => item.name === resource
    );


    // ==========================================
    // RESOURCE AVAILABLE
    // ==========================================

    if (resourceData.available > 0) {

        // Semaphore check for Charging Point

        if (resource === "Charging Point") {

            if (!chargingSemaphore.acquire()) {

                addToWaitingQueue(student, resource);
                return;
            }
        }


        allocateResource(student, resource);

        alert(
            student +
            " successfully got " +
            resource +
            ".\n\n" +
            "Time limit: " +
            RESOURCE_TIME_LIMIT +
            " seconds."
        );

    }


    // ==========================================
    // RESOURCE NOT AVAILABLE
    // ==========================================

    else {

        addToWaitingQueue(student, resource);

        alert(
            resource +
            " is currently unavailable.\n\n" +
            student +
            " has been added to the waiting queue."
        );
    }


    updateDisplay();
}


// ==========================================
// ALLOCATE RESOURCE
// ==========================================

function allocateResource(student, resource) {

    const resourceData = resources.find(
        item => item.name === resource
    );


    if (!resourceData) {
        return;
    }


    // Reduce available resource

    resourceData.available--;


    // Current time

    const now = Date.now();


    // Create allocation

    allocations.push({

        student: student,

        resource: resource,

        allocatedAt: now,

        expiresAt:
            now +
            RESOURCE_TIME_LIMIT * 1000
    });


    updateDisplay();
}


// ==========================================
// ADD TO WAITING QUEUE
// ==========================================

function addToWaitingQueue(student, resource) {

    waitingRequests.push({

        student: student,

        resource: resource,

        requestTime: Date.now()
    });


    updateDisplay();
}


// ==========================================
// RELEASE RESOURCE BUTTON
// ==========================================

function releaseResource() {

    const student =
        document.getElementById("studentSelect").value;

    const resource =
        document.getElementById("resourceSelect").value;


    releaseResourceForStudent(
        student,
        resource,
        false
    );
}


// ==========================================
// RELEASE RESOURCE
// ==========================================

function releaseResourceForStudent(
    student,
    resource,
    automatic = false
) {

    const index = allocations.findIndex(
        item =>
            item.student === student &&
            item.resource === resource
    );


    // Resource not found

    if (index === -1) {

        if (!automatic) {

            alert(
                student +
                " does not currently hold " +
                resource
            );
        }

        return;
    }


    // Remove allocation

    allocations.splice(index, 1);


    // Find resource

    const resourceData = resources.find(
        item => item.name === resource
    );


    if (resourceData) {

        resourceData.available++;


        // Release semaphore for Charging Point

        if (resource === "Charging Point") {

            chargingSemaphore.release();
        }
    }


    // ==========================================
    // AUTOMATIC RELEASE
    // ==========================================

    if (automatic) {

        alert(
            resource +
            " used by " +
            student +
            " has reached the time limit.\n\n" +
            "The resource has been automatically released."
        );
    }


    // ==========================================
    // MANUAL RELEASE
    // ==========================================

    else {

        alert(
            student +
            " released " +
            resource
        );
    }


    // Give resource to waiting student

    allocateWaitingResource(resource);


    updateDisplay();
}


// ==========================================
// ALLOCATE RESOURCE TO WAITING STUDENT
// ==========================================

function allocateWaitingResource(resource) {

    const resourceData = resources.find(
        item => item.name === resource
    );


    if (!resourceData) {
        return;
    }


    // Find first suitable waiting request

    for (let i = 0; i < waitingRequests.length; i++) {

        const request = waitingRequests[i];


        // Check maximum resource limit

        if (
            countStudentResources(request.student)
            >= MAX_RESOURCES_PER_STUDENT
        ) {

            continue;
        }


        // Charging Point semaphore

        if (resource === "Charging Point") {

            if (!chargingSemaphore.acquire()) {
                return;
            }
        }


        // Remove request from waiting queue

        waitingRequests.splice(i, 1);


        // Allocate resource

        allocateResource(
            request.student,
            resource
        );


        alert(
            resource +
            " has been automatically allocated to " +
            request.student +
            " from the waiting queue."
        );


        return;
    }
}


// ==========================================
// DISPLAY RESOURCE STATUS
// ==========================================

function displayResources() {

    const table =
        document.getElementById("resourceTable");


    table.innerHTML = "";


    resources.forEach(resource => {

        const allocatedStudents =
            allocations
                .filter(
                    item =>
                        item.resource === resource.name
                )
                .map(
                    item => item.student
                )
                .join(", ");


        const row = document.createElement("tr");


        row.innerHTML = `

            <td>${resource.name}</td>

            <td>${resource.total}</td>

            <td>${resource.available}</td>

            <td>
                ${
                    allocatedStudents
                    ? allocatedStudents
                    : "None"
                }
            </td>

        `;


        table.appendChild(row);

    });
}


// ==========================================
// DISPLAY CURRENT ALLOCATIONS
// ==========================================

function displayAllocations() {

    const table =
        document.getElementById("allocationTable");


    table.innerHTML = "";


    if (allocations.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="4">
                    No resources are currently allocated.
                </td>
            </tr>
        `;

        return;
    }


    allocations.forEach(item => {

        const remaining =
            Math.ceil(
                (item.expiresAt - Date.now()) / 1000
            );


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>${item.student}</td>

            <td>${item.resource}</td>

            <td>
                ${
                    remaining > 0
                    ? remaining + " seconds"
                    : "EXPIRED"
                }
            </td>

            <td>

                <button
                    onclick="
                        releaseResourceForStudent(
                            '${item.student}',
                            '${item.resource}',
                            false
                        )
                    "
                >
                    Release
                </button>

            </td>

        `;


        table.appendChild(row);

    });
}


// ==========================================
// DISPLAY WAITING REQUESTS
// ==========================================

function displayWaitingRequests() {

    const table =
        document.getElementById("waitingTable");


    table.innerHTML = "";


    if (waitingRequests.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="3">
                    No students are waiting.
                </td>
            </tr>
        `;

        return;
    }


    waitingRequests.forEach(request => {

        const waitingTime =
            Math.floor(
                (Date.now() - request.requestTime)
                / 1000
            );


        let status = "Waiting";


        if (waitingTime >= STARVATION_LIMIT) {

            status =
                "STARVATION WARNING (" +
                waitingTime +
                " sec)";
        }


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>${request.student}</td>

            <td>${request.resource}</td>

            <td>${status}</td>

        `;


        table.appendChild(row);

    });
}


// ==========================================
// RESOURCE ALLOCATION GRAPH
// ==========================================

function displayGraph() {

    const graph =
        document.getElementById("graph");


    graph.innerHTML = "";


    // Allocations

    allocations.forEach(item => {

        const div =
            document.createElement("div");


        div.className = "graph-item allocation";


        div.innerHTML =
            "Resource " +
            item.resource +
            " → Student " +
            item.student +
            " (Allocated)";


        graph.appendChild(div);

    });


    // Waiting requests

    waitingRequests.forEach(item => {

        const div =
            document.createElement("div");


        div.className = "graph-item request";


        div.innerHTML =
            "Student " +
            item.student +
            " → Resource " +
            item.resource +
            " (Waiting)";


        graph.appendChild(div);

    });


    if (
        allocations.length === 0 &&
        waitingRequests.length === 0
    ) {

        graph.innerHTML =
            "No resource allocation or waiting requests.";

    }
}


// ==========================================
// DEADLOCK DETECTION
// ==========================================

function checkDeadlock() {

    let deadlockFound = false;

    let message = "";


    for (
        let i = 0;
        i < waitingRequests.length;
        i++
    ) {

        const request =
            waitingRequests[i];


        // Find owner of requested resource

        const owner =
            allocations.find(
                item =>
                    item.resource === request.resource
            );


        if (!owner) {
            continue;
        }


        // Check whether owner is waiting
        // for a resource held by requester

        const ownerWaiting =
            waitingRequests.find(
                item =>
                    item.student === owner.student
            );


        if (!ownerWaiting) {
            continue;
        }


        const requesterOwns =
            allocations.some(
                item =>
                    item.student === request.student &&
                    item.resource === ownerWaiting.resource
            );


        if (requesterOwns) {

            deadlockFound = true;


            message =
                "DEADLOCK DETECTED!\n\n" +

                request.student +
                " is waiting for " +
                request.resource +

                ", which is held by " +

                owner.student +

                ".\n\n" +

                owner.student +
                " is waiting for " +
                ownerWaiting.resource +

                ", which is held by " +

                request.student +

                ".";


            break;
        }
    }


    const result =
        document.getElementById("deadlockResult");


    if (deadlockFound) {

        result.innerText = message;

        result.className =
            "result danger";

    }

    else {

        result.innerText =
            "No deadlock detected. The system is SAFE.";

        result.className =
            "result success";
    }
}


// ==========================================
// STARVATION CHECK
// ==========================================

function checkStarvation() {

    const now = Date.now();


    const starving =
        waitingRequests.filter(
            request =>

                (
                    now -
                    request.requestTime
                ) / 1000
                >= STARVATION_LIMIT
        );


    const result =
        document.getElementById("deadlockResult");


    if (starving.length > 0) {

        result.innerText =
            "STARVATION WARNING!\n\n" +

            starving
                .map(
                    item =>
                        item.student +
                        " is waiting for " +
                        item.resource
                )
                .join("\n");


        result.className =
            "result warning";

    }

    else {

        result.innerText =
            "No starvation detected.";

        result.className =
            "result success";
    }
}


// ==========================================
// CREATE DEADLOCK EXAMPLE
// ==========================================

function createDeadlock() {

    // Reset everything first

    resetSystem();


    // Student A gets Washing Machine

    allocateResource(
        "Student A",
        "Washing Machine"
    );


    // Student B gets Dryer

    allocateResource(
        "Student B",
        "Dryer"
    );


    // Student A waits for Dryer

    addToWaitingQueue(
        "Student A",
        "Dryer"
    );


    // Student B waits for Washing Machine

    addToWaitingQueue(
        "Student B",
        "Washing Machine"
    );


    updateDisplay();


    const result =
        document.getElementById("deadlockResult");


    result.innerText =
        "Deadlock example created.\n\n" +

        "Student A holds Washing Machine " +
        "and waits for Dryer.\n" +

        "Student B holds Dryer " +
        "and waits for Washing Machine.\n\n" +

        "Now click Check Deadlock.";


    result.className =
        "result danger";
}


// ==========================================
// RESET SYSTEM
// ==========================================

function resetSystem() {

    resources = [

        {
            name: "Washing Machine",
            total: 1,
            available: 1
        },

        {
            name: "Dryer",
            total: 1,
            available: 1
        },

        {
            name: "Iron",
            total: 1,
            available: 1
        },

        {
            name: "Study Room",
            total: 1,
            available: 1
        },

        {
            name: "Charging Point",
            total: 2,
            available: 2
        }
    ];


    waitingRequests = [];

    allocations = [];


    chargingSemaphore =
        new Semaphore(2);


    updateDisplay();
}


// ==========================================
// UPDATE EVERYTHING ON SCREEN
// ==========================================

function updateDisplay() {

    displayResources();

    displayAllocations();

    displayWaitingRequests();

    displayGraph();
}


// ==========================================
// AUTOMATIC TIMEOUT CHECK
// ==========================================

setInterval(() => {

    const now = Date.now();


    // Make a copy because the array
    // can change while processing

    allocations
        .slice()
        .forEach(item => {

            if (now >= item.expiresAt) {

                releaseResourceForStudent(

                    item.student,

                    item.resource,

                    true

                );

            }

        });


    updateDisplay();

}, 1000);


// ==========================================
// INITIAL DISPLAY
// ==========================================

updateDisplay();