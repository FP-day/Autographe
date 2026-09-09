const SUPABASE_URL =
  "https://qkgkfuqaeldyjzibdrmj.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_NJ2AITJvURrPFqrZOG46Kw_sVqRKQ3Q";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const loginPanel = document.querySelector("#loginPanel");
const adminPanel = document.querySelector("#adminPanel");
const loginForm = document.querySelector("#loginForm");
const loginMessage = document.querySelector("#loginMessage");
const requestsContainer = document.querySelector("#requests");
const statsContainer = document.querySelector("#stats");
const logoutButton = document.querySelector("#logout");


/* =========================
   CONNEXION
========================= */

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email =
    document.querySelector("#email").value.trim();

  const password =
    document.querySelector("#password").value;

  loginMessage.textContent =
    "⏳ Vérification de votre autorité impériale...";

  const { data, error } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    console.error("Erreur de connexion Supabase :", error);

    loginMessage.textContent =
      "❌ Accès refusé : " + error.message;

    return;
  }

  console.log("Connexion réussie :", data);

  loginMessage.textContent =
    "👑 Bienvenue, Votre Majesté.";

  await checkSession();
});


/* =========================
   SESSION
========================= */

async function checkSession() {
  const {
    data: { session },
    error
  } = await supabaseClient.auth.getSession();

  if (error) {
    console.error(
      "Erreur de session :",
      error
    );

    showLogin();
    return;
  }

  if (session) {
    showAdmin();
    await loadRequests();
  } else {
    showLogin();
  }
}


/* =========================
   AFFICHAGE
========================= */

function showLogin() {
  loginPanel.style.display = "block";
  adminPanel.style.display = "none";
}

function showAdmin() {
  loginPanel.style.display = "none";
  adminPanel.style.display = "block";
}


/* =========================
   CHARGEMENT DES DEMANDES
========================= */

async function loadRequests() {

  requestsContainer.innerHTML =
    "<p>⏳ Consultation des archives impériales...</p>";

  const {
    data,
    error
  } = await supabaseClient
    .from("requests")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {

    console.error(
      "Erreur chargement demandes :",
      error
    );

    requestsContainer.innerHTML = `
      <p>
        ❌ Impossible de consulter les archives impériales.
      </p>

      <small>
        ${escapeHtml(error.message)}
      </small>
    `;

    return;
  }

  renderStats(data);
  renderRequests(data);
}


/* =========================
   STATISTIQUES
========================= */

function renderStats(all) {

  const pending =
    all.filter(
      request => request.status === "pending"
    ).length;

  const approved =
    all.filter(
      request => request.status === "approved"
    ).length;

  const rejected =
    all.filter(
      request => request.status === "rejected"
    ).length;

  const approvalRate =
    all.length
      ? Math.round(
          approved / all.length * 100
        ) + "%"
      : "—";

  statsContainer.innerHTML = [
    ["TOTAL", all.length],
    ["EN ATTENTE", pending],
    ["CERTIFIÉS", approved],
    ["REFUSÉS", rejected],
    ["TAUX D'APPROBATION", approvalRate]
  ]

  .map(stat => `
    <div class="stat">
      <b>${stat[1]}</b>
      ${stat[0]}
    </div>
  `)

  .join("");
}


/* =========================
   AFFICHAGE DES DEMANDES
========================= */

function renderRequests(all) {

  if (!all.length) {

    requestsContainer.innerHTML = `
      <p>
        Aucun sujet n'a encore sollicité
        l'attention impériale.
      </p>
    `;

    return;
  }

  requestsContainer.innerHTML =
    all.map(request => {

      const date =
        request.created_at
          ? new Date(
              request.created_at
            ).toLocaleString("fr-FR")
          : "Date inconnue";

      let statusText;

      if (request.status === "approved") {

        statusText = "🟢 CERTIFIÉ";

      } else if (
        request.status === "rejected"
      ) {

        statusText = "🔴 REFUSÉ";

      } else {

        statusText = "🟡 EN ATTENTE";
      }

      const fullName =
        [
          request.first_name,
          request.last_name
        ]

        .filter(Boolean)
        .join(" ");

      return `
        <div class="request">

          <div>

            <strong>
              ${escapeHtml(
                fullName ||
                "Sujet anonyme"
              )}
            </strong>

            <br>

            <small>
              ${escapeHtml(
                request.email
              )}

              ·

              ${escapeHtml(date)}
            </small>

            <p>
              ${
                escapeHtml(
                  request.reason ||
                  "Aucun plaidoyer fourni."
                )
              }
            </p>

            <span>
              ${statusText}
              ·
              ${escapeHtml(request.id)}
            </span>

          </div>

          <div class="actions">

  ${
    request.status === "pending"

    ? `

      <select
  class="prestige-select"
  id="prestige-${request.id}"
>
  <option value="1">📜 Niveau 1 — Sujet Toléré</option>
  <option value="2">🏛️ Niveau 2 — Sujet Considéré</option>
  <option value="3">🎖️ Niveau 3 — Candidat Digne d’Examen</option>
  <option value="4">👑 Niveau 4 — Sujet Reconnu</option>
  <option value="5">🏅 Niveau 5 — Dignitaire Impérial</option>
  <option value="6">⭐ Niveau 6 — Proche des Hautes Sphères</option>
  <option value="7">👑 Niveau 7 — Élu de Sa Majesté</option>
</select>

      <button
        class="button small"
        onclick="approveRequest('${request.id}')"
      >
        👑 APPROUVER
      </button>

      <button
        class="ghost small"
        onclick="rejectRequest('${request.id}')"
      >
        ⚔️ REFUSER
      </button>

    `

    : request.status === "approved"

    ? `

      <div class="prestige-display">
        👑 Niveau ${request.prestige_level}
      </div>

      <a
        class="button small"
        href="certificat.html?number=${encodeURIComponent(request.certificate_number)}"
      >
        📜 CERTIFICAT
      </a>

    `

    : ""
  }

</div>

        </div>
      `;

    }).join("");
}


/* =========================
   APPROUVER
========================= */

window.approveRequest = async function(id) {

  const prestigeSelect =
    document.querySelector(
      `#prestige-${id}`
    );

  const prestigeLevel =
    prestigeSelect
      ? Number(prestigeSelect.value)
      : 1;

  const prestigeNames = {
  1: "Sujet Toléré",
  2: "Sujet Considéré",
  3: "Candidat Digne d’Examen",
  4: "Sujet Reconnu",
  5: "Dignitaire Impérial",
  6: "Proche des Hautes Sphères",
  7: "Élu de Sa Majesté"
};

  const confirmation =
    confirm(
      "Confirmer l'approbation de cette candidature ?\n\n" +
      "Rang attribué : " +
      prestigeNames[prestigeLevel]
    );

  if (!confirmation) {
    return;
  }

  const {
    error
  } = await supabaseClient
    .from("requests")
    .update({
      status: "approved",
      prestige_level: prestigeLevel
    })
    .eq("id", id);

  if (error) {

    console.error(error);

    alert(
      "❌ L'autorité impériale n'a pas pu valider cette candidature.\n\n" +
      error.message
    );

    return;
  }

  await loadRequests();
};


/* =========================
   REFUSER
========================= */

window.rejectRequest = async function(id) {

  const confirmation =
    confirm(
      "Êtes-vous absolument certain de vouloir refuser cette candidature ?"
    );

  if (!confirmation) {
    return;
  }

  const {
    error
  } = await supabaseClient
    .from("requests")
    .update({
      status: "rejected"
    })
    .eq("id", id);

  if (error) {

    console.error(error);

    alert(
      "❌ Impossible de prononcer la décision impériale.\n\n" +
      error.message
    );

    return;
  }

  await loadRequests();
};


/* =========================
   DÉCONNEXION
========================= */

logoutButton.addEventListener(
  "click",
  async () => {

    await supabaseClient.auth.signOut();

    showLogin();

    loginForm.reset();

  }
);


/* =========================
   SÉCURITÉ HTML
========================= */

function escapeHtml(value) {

  return String(value)

    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================
   DÉMARRAGE
========================= */

checkSession();