(function () {
    const controls = [...document.querySelectorAll(".control")];
    const sections = [...document.querySelectorAll("header[id], section[id]")];

    function setActiveButton(id) {
        controls.forEach((button) => {
            button.classList.toggle("active-btn", button.dataset.id === id);
        });
    }

    function updateActiveSection() {
        const triggerPoint = window.innerHeight * 0.35;
        let currentId = "home";

        sections.forEach((section) => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= triggerPoint && rect.bottom >= triggerPoint) {
                currentId = section.id;
            }
        });

        setActiveButton(currentId);
    }

    controls.forEach((button) => {
        button.addEventListener("click", function (event) {
            event.preventDefault();
            const targetId = this.dataset.id;
            const target = document.getElementById(targetId);
            setActiveButton(targetId);

            if (target) {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });

    window.addEventListener("scroll", updateActiveSection, { passive: true });
    updateActiveSection();

    document.querySelector(".theme-btn").addEventListener("click", () => {
        document.body.classList.toggle("light-mode");
    });
})();