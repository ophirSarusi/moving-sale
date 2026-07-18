"use strict";

const RESERVED_DIALOG_NOTE_TEXT = "הפריט שמור כרגע. אפשר להשאיר הודעה ונעדכן אם הוא יתפנה.";

// item-actions.js observes dialog DOM changes. Rewriting this note on every
// observer callback created another child-list mutation and an infinite loop.
updateReservedDialogNote = function updateReservedDialogNoteSafely(item) {
  const details = document.querySelector(".dialog-details");
  if (!details) return;

  let note = details.querySelector(".reserved-waitlist-note");

  if (item.status !== "reserved") {
    note?.remove();
    return;
  }

  if (!note) {
    const description = details.querySelector(".dialog-description");
    if (!description) return;

    note = document.createElement("p");
    note.className = "reserved-waitlist-note";
    note.textContent = RESERVED_DIALOG_NOTE_TEXT;
    description.insertAdjacentElement("afterend", note);
    return;
  }

  if (note.textContent !== RESERVED_DIALOG_NOTE_TEXT) {
    note.textContent = RESERVED_DIALOG_NOTE_TEXT;
  }
};
