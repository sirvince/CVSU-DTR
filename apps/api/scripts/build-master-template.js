// One-off tool: derives storage/templates/dtr/DTR-FORMAT-MASTER.xlsx from a real,
// filled-in DTR export. Keeps the "November 1-30 2024" sheet's structure/formatting
// (title, day-number column, footer/certification/signature block, merges, styles)
// and clears every cell that held real personal data (teacher name, period label,
// and the AM/PM Arrival/Departure + Under Time grid for day rows 17-47), plus drops
// the workbook's other sheets, which contained other real people's filled DTRs.
//
// Usage: node scripts/build-master-template.js <path-to-source-xlsx>
//
// Re-run this if the official DTR format changes and a new real-sample export is
// used as the source — see the cell-mapping doc in CLAUDE.md's "Excel generation
// strategy" section for what each column means before touching this script.
const path = require('node:path');
const ExcelJS = require('exceljs');

const SOURCE_SHEET = 'November 1-30 2024';
const FIRST_DAY_ROW = 17;
const LAST_DAY_ROW = 47; // day 31

async function main() {
  const sourcePath = process.argv[2];
  if (!sourcePath) {
    console.error('Usage: node scripts/build-master-template.js <path-to-source-xlsx>');
    process.exit(1);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(sourcePath);

  const sheet = workbook.getWorksheet(SOURCE_SHEET);
  if (!sheet) {
    throw new Error(`Expected a sheet named "${SOURCE_SHEET}" in ${sourcePath}`);
  }

  // Drop every other sheet — they hold other real people's filled DTRs and aren't
  // part of the template we generate from.
  for (const ws of [...workbook.worksheets]) {
    if (ws.name !== SOURCE_SHEET) {
      workbook.removeWorksheet(ws.id);
    }
  }
  sheet.name = 'DTR';

  // Clear teacher name and period label placeholders.
  sheet.getCell('D6').value = null;
  sheet.getCell('H9').value = null;

  // Signature-line underlines: neither the real source export nor the master
  // template (before this) has any borders at all in these two spots, so a
  // printed/opened DTR shows the teacher's name and the verifying officer's
  // name floating with no line to sign on above them and no visual separator
  // from their "(NAME)"/"In Charge" captions below. `underlineRow` adds a
  // bottom border across a column range on one row.
  //
  // IMPORTANT (bug caught during a live rebuild — briefly landed 317
  // unintended borders across nearly the whole sheet): `cell.border = {...}`
  // mutates the cell's *shared* underlying style object in place when many
  // otherwise-unstyled cells share one style by reference, corrupting every
  // other cell pointing at it, not just the one being touched — same failure
  // mode the numFmt comment below already documents, just via `.border`.
  // `underlineRow` goes through `cell.style = { ...cell.style, border: ... }`
  // instead, replacing the whole style object per cell, exactly like the
  // numFmt fix. Any future border edit here must do the same, and must be
  // verified with a full before/after border diff across the *entire*
  // sheet, not just the cells intentionally touched — a spot-check of only
  // the target cells missed this bug the first time it happened.
  const UNDERLINE_BORDER = { style: 'thin', color: { indexed: 64 } };
  function underlineRow(row, startCol, endCol) {
    const startIdx = startCol.charCodeAt(0);
    const endIdx = endCol.charCodeAt(0);
    for (let c = startIdx; c <= endIdx; c++) {
      const cell = sheet.getCell(`${String.fromCharCode(c)}${row}`);
      cell.style = { ...cell.style, border: { ...cell.border, bottom: UNDERLINE_BORDER } };
    }
  }

  // Teacher-name signature line, above the "(NAME)" caption (D6:J6, merged —
  // every constituent cell needs the border set for it to render as one
  // continuous line across the merge, not just the top-left cell).
  underlineRow(6, 'D', 'J');
  // Verifying officer's signature line, above "DR. AGNES C. FRANCISCO" / "In
  // Charge" (E56:I56 — not merged in the source; width chosen to comfortably
  // span the name text, matching the "(NAME)" caption's merge width above).
  underlineRow(56, 'E', 'I');
  // "For the month of ____" — the blank where the period label prints
  // (PERIOD_LABEL_CELL = H9), narrowed to G9:J9 per adjustment.
  underlineRow(9, 'G', 'J');
  // "Regular days ____" / "Saturdays ____" — fill-in blanks to the right of
  // those two labels (this system doesn't generate either value; they're
  // filled in by hand). The paired blanks after "Official hours for
  // arrival"/"and departure" (E10:G10, F11:G11) were removed per adjustment.
  underlineRow(10, 'I', 'J');
  underlineRow(11, 'I', 'J');
  // Teacher's own certification signature line, right above "Verified as to
  // the prescribe office hours:" (row 55) — blank row 54 for the teacher to
  // sign under the "I CERTIFY..." paragraph (rows 50-52). The separate blank
  // after "Verified as to..." itself (F55:J55) was removed per adjustment.
  underlineRow(54, 'E', 'I');

  // Clear the day-grid: shift-code notes (B:C), AM/PM Arrival+Departure (E:H),
  // and Under Time Hours/Minutes (I:J). Day numbers in column D (1-31) stay —
  // they're static template content, not per-generation data.
  for (let row = FIRST_DAY_ROW; row <= LAST_DAY_ROW; row++) {
    for (const col of ['B', 'E', 'F', 'G', 'H', 'I', 'J']) {
      const cell = sheet.getCell(`${col}${row}`);
      cell.value = null;
    }
    // Every Arrival/Departure cell must render as a time regardless of whether
    // the source row happened to have that exact numFmt set (some rows in the
    // real sample were missing it - see CLAUDE.md for the two rows that were).
    // IMPORTANT: assign a whole new style object rather than `cell.numFmt = x`
    // — ExcelJS cells can share a single style object by reference (e.g. every
    // un-styled cell in a row pointing at the same default style), so mutating
    // `.numFmt` in place silently corrupted the *other* cells sharing that
    // object (this broke column D's day numbers on rows 40-47 the first time).
    for (const col of ['E', 'F', 'G', 'H']) {
      const cell = sheet.getCell(`${col}${row}`);
      cell.style = { ...cell.style, numFmt: 'h:mm' };
    }
  }

  // Day-grid font: B17:J48 (day rows 1-31 plus the closing border row 48)
  // uniformly set to Calibri 16 on request, so every cell in the table reads
  // consistently regardless of whatever font each row/cell happened to carry
  // in the real source export. Same safe `cell.style = {...}` pattern as
  // everywhere else in this script — spreads the cell's *own* current font
  // rather than mutating `.font` in place, which is what corrupted shared
  // style objects the two times that mistake was made with `.border`/
  // `.numFmt` above.
  const DAY_GRID_FONT = { name: 'Calibri', size: 16 };
  for (let row = FIRST_DAY_ROW; row <= 48; row++) {
    for (const col of ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']) {
      const cell = sheet.getCell(`${col}${row}`);
      cell.style = { ...cell.style, font: { ...cell.font, ...DAY_GRID_FONT } };
    }
  }

  const outPath = path.join(
    __dirname,
    '..',
    'storage',
    'templates',
    'dtr',
    'DTR-FORMAT-MASTER.xlsx',
  );
  await workbook.xlsx.writeFile(outPath);
  console.log('Wrote', outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
