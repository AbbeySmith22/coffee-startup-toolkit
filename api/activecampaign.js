
const STAGE_TAGS = {
  "Early Planning": "Coffee Startup - Early Planning",
  "Building Your Foundation": "Coffee Startup - Building Foundation",
  "Advanced Planning": "Coffee Startup - Advanced Planning"
};

const ASSESSMENT_TAG =
  "Coffee Toolkit - Readiness Assessment";

function getConfig() {
  const url = process.env.ACTIVECAMPAIGN_API_URL;
  const key = process.env.ACTIVECAMPAIGN_API_KEY;

  if (!url || !key) {
    throw new Error("ActiveCampaign is not configured");
  }

  return {
    baseUrl: url.replace(/\/+$/, "").replace(/\/api\/3$/, "") + "/api/3",
    key
  };
}

async function acRequest(path, options = {}) {
  const { baseUrl, key } = getConfig();

  const response = await fetch(baseUrl + path, {
    ...options,
    headers: {
      "Api-Token": key,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(
      `ActiveCampaign request failed: ${response.status}`
    );
  }

  return response.json();
}

async function findOrCreateContact(name, email) {
  const parts = name.trim().split(/\s+/);
  const firstName = parts.shift() || "";
  const lastName = parts.join(" ");

  const result = await acRequest("/contact/sync", {
    method: "POST",
    body: JSON.stringify({
      contact: {
        email,
        firstName,
        lastName
      }
    })
  });

  if (!result.contact?.id) {
    throw new Error("ActiveCampaign did not return a contact");
  }

  return result.contact.id;
}

async function getTagId(tagName) {
  let offset = 0;

  while (true) {
    const result = await acRequest(
      `/tags?limit=100&offset=${offset}`
    );

    const tags = result.tags || [];
    const match = tags.find(tag => tag.tag === tagName);

    if (match) return match.id;

    if (tags.length < 100) break;
    offset += 100;
  }

  throw new Error(`ActiveCampaign tag not found: ${tagName}`);
}

async function addTag(contactId, tagId) {
  await acRequest("/contactTags", {
    method: "POST",
    body: JSON.stringify({
      contactTag: {
        contact: String(contactId),
        tag: String(tagId)
      }
    })
  });
}

async function saveAssessmentContact({
  name,
  email,
  stage,
  marketingConsent
}) {
  const contactId = await findOrCreateContact(name, email);

  const assessmentTagId = await getTagId(ASSESSMENT_TAG);
  const stageTagId = await getTagId(STAGE_TAGS[stage]);

  // Avoid adding duplicate contact-tag associations.
  const existing = await acRequest(
    `/contacts/${contactId}/contactTags?limit=100`
  );

  const assignedTagIds = new Set(
    (existing.contactTags || []).map(item => String(item.tag))
  );

  if (!assignedTagIds.has(String(assessmentTagId))) {
    await addTag(contactId, assessmentTagId);
  }

  // Remove outdated readiness-stage tags.
  // Keep all unrelated tags untouched.
  const allStageTagIds = await Promise.all(
    Object.values(STAGE_TAGS).map(getTagId)
  );

  const outdatedTagIds = allStageTagIds
    .map(String)
    .filter(id =>
      id !== String(stageTagId) &&
      assignedTagIds.has(id)
    );

  for (const outdatedTagId of outdatedTagIds) {
    const currentTags = await acRequest(
      `/contacts/${contactId}/contactTags?limit=100`
    );

    const association = (currentTags.contactTags || [])
      .find(item =>
        String(item.tag) === outdatedTagId
      );

    if (association) {
      await acRequest(
        `/contactTags/${association.id}`,
        { method: "DELETE" }
      );
    }
  }

  if (!assignedTagIds.has(String(stageTagId))) {
    await addTag(contactId, stageTagId);
  }

 // Record explicit marketing consent without changing
// the contact's existing subscription status.
if (marketingConsent === true) {
  const optInTagId = await getTagId(
    "Coffee Toolkit - Marketing Opt-In"
  );

  if (!assignedTagIds.has(String(optInTagId))) {
    await addTag(contactId, optInTagId);
  }
}

  return contactId;
}

module.exports = { saveAssessmentContact };
