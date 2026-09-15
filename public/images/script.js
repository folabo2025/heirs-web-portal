// Toggle Side Menu
function toggleMenu() {
    const menu = document.getElementById("sideMenu");
    if (menu.style.left === "0px") {
        menu.style.left = "-200px";
    } else {
        menu.style.left = "0px";
    }
}

// Open Video (Simplified for demo)
function openVideo(videoId) {
    // In real projects, you would dynamically load content
    // For now, just simulate with alert
    alert("Opening video: " + videoId);

    // Optional: redirect to watch.html
    // window.location.href = "watch.html";
}
