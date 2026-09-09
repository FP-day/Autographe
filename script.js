const SUPABASE_URL =
  "https://qkgkfuqaeldyjzibdrmj.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_NJ2AITJvURrPFqrZOG46Kw_sVqRKQ3Q";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* =========================
   FORMULAIRE DE CANDIDATURE
========================= */

const form = document.querySelector("#requestForm");

if (form) {

  form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const button =
      form.querySelector("button[type='submit']");

    button.disabled = true;

    button.textContent =
      "⏳ TRANSMISSION À L'EMPEREUR...";

    const formData =
      new FormData(form);

    const request = {
      first_name: formData.get("name"),
      last_name: formData.get("surname"),
      email: formData.get("email"),
      reason: formData.get("reason"),
      status: "pending",
      prestige_level: 1
    };


    const {
      data,
      error
    } = await supabaseClient
      .from("requests")
      .insert(request)
      .select()
      .single();


    if (error) {

      console.error(
        "Erreur Supabase :",
        error
      );

      button.disabled = false;

      button.textContent =
        "SOUMETTRE MA DEMANDE À MON EMPEREUR";

      alert(
        "❌ L'administration impériale refuse actuellement de recevoir votre dossier.\n\n" +
        error.message
      );

      return;
    }


    sessionStorage.setItem(
      "lastRequest",
      JSON.stringify(data)
    );


    location.href =
      "confirmation.html";

  });

}


/* =========================
   PAGE DE CONFIRMATION
========================= */

const confirmation =
  document.querySelector("#confirmation");

if (confirmation) {

  const saved =
    sessionStorage.getItem("lastRequest");

  const request =
    saved
      ? JSON.parse(saved)
      : null;


  if (request) {

    const fullName =
      [
        request.first_name,
        request.last_name
      ]
      .filter(Boolean)
      .join(" ");


    confirmation.innerHTML = `

      <div class="eyebrow">
        🎉 DEMANDE ENREGISTRÉE
      </div>

      <h1>
        Votre candidature a atteint
        les plus hautes sphères.
      </h1>

      <p>
        Votre dossier est désormais entre
        les mains de
        <strong>
          l'unique autorité habilitée
          à prendre une décision :
          moi-même.
        </strong>
      </p>

      <h2>
        ${escapeHtml(
          request.certificate_number ||
          "NUMÉRO EN COURS D'ATTRIBUTION"
        )}
      </h2>

      <p>
        Candidat :
        <strong>
          ${escapeHtml(fullName)}
        </strong>
      </p>

      <p>
        Statut :
        🟡 EN ATTENTE DE DÉCISION IMPÉRIALE
      </p>

      <p class="fine">
        L'Empereur est actuellement très occupé
        à être l'Empereur.
      </p>

      <a
        class="button"
        href="index.html"
      >
        RETOURNER AU PORTAIL IMPÉRIAL
      </a>

    `;

  } else {

    confirmation.innerHTML = `

      <div class="eyebrow">
        DOSSIER IMPÉRIAL
      </div>

      <h1>
        Aucun dossier récent.
      </h1>

      <p>
        L'administration impériale
        ne retrouve aucune candidature
        récente sur cet appareil.
      </p>

      <a
        class="button"
        href="inscription.html"
      >
        FAIRE UNE NOUVELLE DEMANDE
      </a>

    `;

  }

}


/* =========================
   VÉRIFICATION CERTIFICAT
========================= */

const verify =
  document.querySelector("#verifyForm");

if (verify) {

  verify.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const certificateNumber =
        document
          .querySelector("#certInput")
          .value
          .trim()
          .toUpperCase();

      const out =
        document.querySelector("#verifyResult");


      out.innerHTML =
        "<p>⏳ Consultation des archives impériales...</p>";


      const {
        data,
        error
      } = await supabaseClient
        .from("requests")
        .select(
          "first_name,last_name,status,prestige_level,certificate_number,created_at"
        )
        .eq(
          "certificate_number",
          certificateNumber
        )
        .eq(
          "status",
          "approved"
        )
        .maybeSingle();


      if (error) {

        console.error(
          "Erreur vérification :",
          error
        );

        out.innerHTML = `

          <div class="verified">

            <h2>
              ⚠️ ERREUR ADMINISTRATIVE
            </h2>

            <p>
              Le registre impérial
              est actuellement inaccessible.
            </p>

          </div>

        `;

        return;
      }


      if (!data) {

        out.innerHTML = `

          <div class="verified">

            <h2>
              ❌ CERTIFICAT INTROUVABLE
            </h2>

            <p>
              L'Empire ne reconnaît pas
              ce numéro de certification.
            </p>

            <p>
              Le certificat est peut-être
              inexistant, invalide ou encore
              en attente de validation impériale.
            </p>

          </div>

        `;

        return;
      }


      const fullName =
        [
          data.first_name,
          data.last_name
        ]
        .filter(Boolean)
        .join(" ");


      out.innerHTML = `

        <div class="verified">

          <h2>
            👑 CERTIFICAT AUTHENTIFIÉ
          </h2>

          <p>
            Titulaire :
            <strong>
              ${escapeHtml(fullName)}
            </strong>
          </p>

          <p>
            N° de certification :
            <strong>
              ${escapeHtml(
                data.certificate_number
              )}
            </strong>
          </p>

          <p>
            Certifié par :
            <strong>
              FP_day
            </strong>
          </p>

          <p>
            Statut :
            <strong>
              DIGNEMENT CERTIFIÉ
            </strong>
          </p>

          <a
            class="button small"
            href="certificat.html?number=${encodeURIComponent(
              data.certificate_number
            )}"
          >
            📜 VOIR LE CERTIFICAT
          </a>

        </div>

      `;

    }
  );

}


/* =========================
   CERTIFICAT
========================= */

async function loadCertificate() {

  const params =
    new URLSearchParams(
      location.search
    );

  const certificateNumber =
    params.get("number");


  if (!certificateNumber) {
    return;
  }


  const {
    data,
    error
  } = await supabaseClient
    .from("requests")
    .select(
      "first_name,last_name,status,prestige_level,certificate_number,created_at"
    )
    .eq(
      "certificate_number",
      certificateNumber.toUpperCase()
    )
    .eq(
      "status",
      "approved"
    )
    .maybeSingle();


  if (error) {

    console.error(
      "Erreur certificat :",
      error
    );

    return;
  }


  if (!data) {
    return;
  }


  const holder =
    document.querySelector("#holder");

  const number =
    document.querySelector("#number");

  const date =
    document.querySelector("#date");

  const rarity =
    document.querySelector("#rarity");


  if (holder) {

    holder.textContent =
      [
        data.first_name,
        data.last_name
      ]
      .filter(Boolean)
      .join(" ");

  }


  if (number) {

    number.textContent =
      data.certificate_number;

  }


  if (date && data.created_at) {

    date.textContent =
      new Date(
        data.created_at
      ).toLocaleDateString(
        "fr-FR"
      );

  }


  if (rarity) {

  const prestigeNames = {
    1: "SUJET TOLÉRÉ",
    2: "SUJET CONSIDÉRÉ",
    3: "CANDIDAT DIGNE D’EXAMEN",
    4: "SUJET RECONNU",
    5: "DIGNITAIRE IMPÉRIAL",
    6: "PROCHE DES HAUTES SPHÈRES",
    7: "👑 ÉLU DE SA MAJESTÉ"
  };

  const prestigeDescriptions = {
    1:
      "L’Empire accepte temporairement votre existence administrative.",

    2:
      "Votre dossier a retenu l’attention de l’administration. Enfin, légèrement.",

    3:
      "Votre candidature mérite désormais que l’Empereur envisage éventuellement de l’examiner.",

    4:
      "Votre existence commence à présenter un intérêt pour l’Empire.",

    5:
      "Vous faites désormais partie des personnes dont l’Empereur connaît potentiellement le nom.",

    6:
      "Votre proximité avec Sa Majesté devient préoccupante pour les autres sujets.",

    7:
      "Vous avez atteint le sommet. Il n’existe officiellement aucun niveau supérieur, principalement parce que l’Empereur n’a pas jugé nécessaire d’en créer un."
  };

  const level =
    Number(data.prestige_level) || 1;

  rarity.textContent =
    prestigeNames[level] ||
    prestigeNames[1];

  const prestigeText =
    document.querySelector("#prestigeDescription");

  if (prestigeText) {

    prestigeText.textContent =
      prestigeDescriptions[level] ||
      prestigeDescriptions[1];

  }

}

}


if (
  document.querySelector("#certificate")
) {

  loadCertificate();

}


/* =========================
   PROTECTION HTML
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
   REGISTRE PUBLIC
========================= */

const registry =
  document.querySelector("#registry");

if (registry) {

  loadRegistry();

}


async function loadRegistry() {

  const {
    data,
    error
  } = await supabaseClient
    .from("requests")
    .select(
      "first_name,last_name,prestige_level,certificate_number,created_at"
    )
    .eq(
      "status",
      "approved"
    )
    .order(
      "created_at",
      {
        ascending: false
      }
    );


  if (error) {

    console.error(
      "Erreur registre :",
      error
    );

    registry.innerHTML = `

      <div class="verified">

        <h2>
          ⚠️ ARCHIVES INACCESSIBLES
        </h2>

        <p>
          Le registre impérial ne peut
          actuellement pas être consulté.
        </p>

      </div>

    `;

    return;

  }


  if (!data || data.length === 0) {

    registry.innerHTML = `

      <div class="verified">

        <h2>
          📜 REGISTRE ACTUELLEMENT VIDE
        </h2>

        <p>
          Aucun sujet n'a encore reçu
          l'honneur d'une certification impériale.
        </p>

      </div>

    `;

    return;

  }


  const prestigeNames = {

    1: "Sujet Toléré",
    2: "Sujet Considéré",
    3: "Candidat Digne d’Examen",
    4: "Sujet Reconnu",
    5: "Dignitaire Impérial",
    6: "Proche des Hautes Sphères",
    7: "Élu de Sa Majesté"

  };


  registry.innerHTML = data.map(request => {

    const fullName =
      [
        request.first_name,
        request.last_name
      ]
      .filter(Boolean)
      .join(" ");


    const date =
      request.created_at
        ? new Date(
            request.created_at
          ).toLocaleDateString("fr-FR")
        : "—";


    return `

      <article class="registry-card">

        <div class="registry-crown">
          👑
        </div>

        <h2>
          ${escapeHtml(fullName)}
        </h2>

        <p class="registry-prestige">
          ${escapeHtml(
            prestigeNames[request.prestige_level] ||
            "Sujet Impérial"
          )}
        </p>

        <p>
          <strong>
            N° de certification :
          </strong>

          ${escapeHtml(
            request.certificate_number
          )}
        </p>

        <p>
          <strong>
            Date de certification :
          </strong>

          ${date}
        </p>

        <a
          class="button small"
          href="certificat.html?number=${encodeURIComponent(
            request.certificate_number
          )}"
        >
          📜 VOIR LE CERTIFICAT
        </a>

      </article>

    `;

  }).join("");

}