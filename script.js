const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ---------- Hover preview for the places index ---------- */
const peek = document.getElementById("peek");
const peekImg = peek.querySelector("img");
const rows = document.querySelectorAll(".row");
let tx = 0, ty = 0, cx = 0, cy = 0, rafId = null;

function loop() {
    cx += (tx - cx) * 0.16;
    cy += (ty - cy) * 0.16;
    const tilt = Math.max(-6, Math.min(6, (tx - cx) * 0.12));
    peek.style.transform = `translate3d(${cx}px, ${cy}px, 0) rotate(${tilt}deg)`;
    rafId = requestAnimationFrame(loop);
}

function showPeek(row) {
    peekImg.src = row.dataset.img;
    peek.classList.add("show");
    if (!rafId) rafId = requestAnimationFrame(loop);
}

function hidePeek() {
    peek.classList.remove("show");
    cancelAnimationFrame(rafId);
    rafId = null;
}

if (finePointer && window.innerWidth > 800) {
    rows.forEach(row => {
        row.addEventListener("pointerenter", e => {
            tx = cx = e.clientX + 24;
            ty = cy = e.clientY - peek.offsetHeight / 2;
            showPeek(row);
        });
        row.addEventListener("pointermove", e => {
            tx = e.clientX + 24;
            ty = e.clientY - peek.offsetHeight / 2;
        });
        row.addEventListener("pointerleave", hidePeek);
        row.addEventListener("focus", () => {
            const r = row.getBoundingClientRect();
            tx = cx = r.right - peek.offsetWidth - 40;
            ty = cy = r.top + r.height / 2 - peek.offsetHeight / 2;
            peekImg.src = row.dataset.img;
            peek.classList.add("show");
            peek.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
        });
        row.addEventListener("blur", hidePeek);
    });
    window.addEventListener("scroll", () => {
        if (peek.classList.contains("show") && document.activeElement && document.activeElement.classList.contains("row")) hidePeek();
    }, { passive: true });
}

/* ---------- Accordions (themes and destination panels) ---------- */
function accordion(container, itemSelector) {
    const items = Array.from(container.querySelectorAll(itemSelector));
    function open(item) {
        items.forEach(i => i.classList.toggle("is-open", i === item));
    }
    items.forEach(item => {
        item.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") open(item); });
        item.addEventListener("focus", () => open(item));
        item.addEventListener("click", () => open(item));
    });
}

accordion(document.getElementById("themes"), ".theme");
document.querySelectorAll(".stage").forEach(stage => accordion(stage, ".dest"));

/* ---------- Destination tabs ---------- */
const tabs = Array.from(document.querySelectorAll('.tabs [role="tab"]'));

function selectTab(name, focus) {
    tabs.forEach(t => {
        const on = t.dataset.tab === name;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
    });
    document.querySelectorAll(".stage").forEach(s => { s.hidden = s.id !== name; });
}

tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => selectTab(tab.dataset.tab));
    tab.addEventListener("keydown", e => {
        let next = null;
        if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
        if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
        if (next !== null) {
            e.preventDefault();
            selectTab(tabs[next].dataset.tab, true);
        }
    });
});

document.querySelectorAll("a[data-tab]").forEach(link => link.addEventListener("click", e => {
    e.preventDefault();
    selectTab(link.dataset.tab);
    document.getElementById("destinations").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
}));

/* ---------- Parallax on the wide image ---------- */
const wide = document.getElementById("wide");
if (wide && !reduceMotion) {
    const img = wide.querySelector("img");
    let ticking = false;

    function parallax() {
        const rect = wide.getBoundingClientRect();
        const vh = window.innerHeight;
        if (rect.bottom > 0 && rect.top < vh) {
            const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
            const max = rect.height * 0.15;
            const shift = Math.max(-max, Math.min(max, -progress * max * 2));
            img.style.transform = `translateY(${shift - max}px)`;
        }
        ticking = false;
    }

    window.addEventListener("scroll", () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(parallax);
        }
    }, { passive: true });
    window.addEventListener("resize", parallax);
    parallax();
}

/* ---------- Contact form ---------- */
const scriptURL = "https://script.google.com/macros/s/AKfycbycn3t7qcD1KZxNwJqSyEeKJDHAUHyk3Dcv0UKEoIjh4Rxqrjns9oh2pcX_fxHoSio/exec";
const form = document.getElementById("contactForm");
const statusEl = document.getElementById("formStatus");
const sendBtn = document.getElementById("sendBtn");
let statusTimer;

function showStatus(text) {
    statusEl.textContent = text;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { statusEl.textContent = ""; }, 5000);
}

form.addEventListener("submit", e => {
    e.preventDefault();
    sendBtn.disabled = true;
    const data = new FormData(form);
    const picked = data.getAll("interest");
    data.delete("interest");
    data.append("interest", picked.join(", "));
    fetch(scriptURL, { method: "POST", body: data })
        .then(() => {
            showStatus("Thanks, we got your message and will reply soon.");
            form.reset();
        })
        .catch(() => showStatus("Could not send. Check your connection and try again."))
        .finally(() => { sendBtn.disabled = false; });
});