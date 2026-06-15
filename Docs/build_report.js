const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, LevelFormat, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, Header, Footer,
  TabStopType, TabStopPosition
} = require('docx');
const fs = require('fs');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TNR = (text, opts = {}) => new TextRun({ text, font: "Times New Roman", size: 24, ...opts });

function para(text, opts = {}) {
  const { bold, italic, center, indent, spacing, heading, size } = opts;
  return new Paragraph({
    ...(heading ? { heading } : {}),
    alignment: center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    indent: indent ? { left: 720 } : undefined,
    spacing: spacing || { line: 360, before: 0, after: 120 },
    children: [TNR(text, { bold: bold || false, italics: italic || false, size: size || 24 })]
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 360, after: 240, line: 360 },
    children: [TNR(text, { bold: true, size: 28, allCaps: true })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160, line: 360 },
    children: [TNR(text, { bold: true, size: 26 })]
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120, line: 360 },
    children: [TNR(text, { bold: true, italic: true, size: 24 })]
  });
}

function body(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 360, before: 0, after: 160 },
    children: [TNR(text)]
  });
}

function blank() {
  return new Paragraph({ spacing: { line: 360, before: 0, after: 0 }, children: [TNR("")] });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function centered(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: 360, before: 0, after: 120 },
    children: [TNR(text, { ...opts, font: "Times New Roman" })]
  });
}

function bullet(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 360, before: 0, after: 120 },
    numbering: { reference: "bullets", level: 0 },
    children: [TNR(text)]
  });
}

function numbered(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 360, before: 0, after: 120 },
    numbering: { reference: "numbers", level: 0 },
    children: [TNR(text)]
  });
}

// Simple 2-column table helper
function twoColTable(rows, headerRow) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
  const borders = { top: border, bottom: border, left: border, right: border };
  const makeCell = (text, isHeader, width) => new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: isHeader ? { fill: "D9D9D9", type: ShadingType.CLEAR } : { fill: "FFFFFF", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [TNR(text, { bold: isHeader })]
    })]
  });
  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [3000, 6026],
    rows: rows.map((r, i) => new TableRow({
      children: [makeCell(r[0], i === 0 && headerRow, 3000), makeCell(r[1], i === 0 && headerRow, 6026)]
    }))
  });
}

function threeColTable(rows, headerRow) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
  const borders = { top: border, bottom: border, left: border, right: border };
  const w = [2000, 3500, 3526];
  const makeCell = (text, isHeader, width) => new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: isHeader ? { fill: "D9D9D9", type: ShadingType.CLEAR } : { fill: "FFFFFF", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      children: [TNR(text, { bold: isHeader })]
    })]
  });
  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: w,
    rows: rows.map((r, i) => new TableRow({
      children: r.map((cell, j) => makeCell(cell, i === 0 && headerRow, w[j]))
    }))
  });
}

// ─── Document sections ────────────────────────────────────────────────────────

const titlePage = [
  blank(), blank(),
  centered("THE ICT UNIVERSITY", { bold: true, size: 28 }),
  blank(),
  centered("Faculty of Information and Communication Technology", { bold: true }),
  blank(), blank(),
  centered("A dissertation presented and submitted in partial fulfilment of the requirement", { italic: true }),
  centered("for the degree of a Bachelor of Science in Software Engineering", { italic: true }),
  blank(), blank(),
  centered("Title", { bold: true }),
  blank(),
  centered("Design and Implementation of a Secure Mobile-Based", { bold: true, size: 28 }),
  centered("Tontine (\"Njangi\") Management System", { bold: true, size: 28 }),
  blank(), blank(),
  centered("By", { italic: true }),
  blank(),
  centered("Fonguh Joy Akwi"),
  centered("Registration Number: ICTU20223039"),
  blank(), blank(),
  centered("Supervised by: Engr. Moune"),
  blank(), blank(), blank(),
  centered("July 2026"),
];

const declaration = [
  pageBreak(),
  h1("DECLARATION"),
  body("I declare that the work entitled \"Design and Implementation of a Secure Mobile-Based Tontine (\"Njangi\") Management System\" is my own original work, conceived and presented in the partial fulfilment of the requirement for the degree of a Bachelor of Science in Software Engineering at ICT University. This work has not been submitted for any degree or examination in any other university, and that all the sources I have used or quoted have been indicated and acknowledged as complete references."),
  blank(),
  body("Signed: _______________________                          Date: _______________________"),
  blank(),
  body("Name: _______________________"),
  blank(),
  body("Registration Number: ____________________"),
];

const certification = [
  pageBreak(),
  h1("CERTIFICATION"),
  body("This work entitled \"Design and Implementation of a Secure Mobile-Based Tontine (\"Njangi\") Management System\" has been submitted for examination with my approval as the Research Supervisor."),
  blank(),
  body("Signed: _______________________                          Date: _______________________"),
  blank(),
  body("Name: _______________________"),
];

const dedications = [
  pageBreak(),
  h1("DEDICATIONS"),
  body("To Almighty God, the Author and Finisher of my faith. Every chapter of this thesis was written under the shadow of Your grace. There were moments of doubt, moments of exhaustion, and moments when giving up seemed easier than pressing on — but You were constant. I held on to Philippians 4:13: \"I can do all things through Christ who strengthens me,\" and You proved that Word true, time and time again. This work is, before anything else, an act of worship and a testament to Your faithfulness."),
  blank(),
  body("To my late father, Pa Fonguh — my first teacher. You left before you could see this day, but your fingerprints are on every page. You instilled in me the unshakable belief that education is the one inheritance no one can take away. \"Practice makes perfect,\" you would say — and I carried those words into every late night of study, every revision, every moment I wanted to quit but did not. You set the standard before I even understood what standard meant. You taught me resilience — not by lecture, but by the quiet, steady example of your life. This one is for you, Daddy. I hope I have made you proud."),
  blank(),
  body("To my beloved mother, Mami Fonguh — my greatest supporter. You may not have always understood the long nights, the piles of books, or the weight of what I was working toward — but you showed up anyway. That is the kind of love that cannot be taught; it can only be lived. You invested in me in every way a mother can: emotionally, spiritually, physically, and morally. You carried me in prayer when I was too tired to pray for myself. You reminded me of my worth when the journey made me forget it. Everything I am, and everything I have achieved, is built on the foundation you laid. This one is for you, Mummy."),
  blank(),
  body("To my siblings — my anchors. You made what was hard feel lighter. On the days when the road felt long and lonely, your presence — whether near or far — reminded me that I was never truly alone. You believed in me, cheered me on, and held me up in ways both big and small. I am deeply blessed to call you family. This one is for you all."),
  blank(),
  body("\"And finally, to myself — for the late nights I pushed through alone, for every moment I chose to continue when stopping felt easier, for the discipline I showed even when no one was watching, and for believing in this work even when I doubted myself. This journey required a version of me I had not yet met, and I am proud of who I became in the process.\""),
];

const acknowledgements = [
  pageBreak(),
  h1("ACKNOWLEDGEMENTS"),
  body("The completion of this thesis was not a solitary achievement. It is the product of the collective wisdom, encouragement, patience, and sacrifice of many people, and it is my honour to acknowledge them here."),
  body("First and foremost, I give all glory and honour to Almighty God, whose grace made this academic journey possible from beginning to end. Without His divine guidance and sustenance, none of this would have been conceivable."),
  body("I owe an immeasurable debt of gratitude to my supervisor, Engr. Moune, whose intellectual rigour, constructive feedback, and unwavering guidance shaped this work into what it is. Your patience in the face of my questions, and your insistence on excellence, challenged me to think deeper and reach further than I thought possible. I am truly grateful."),
  body("I extend sincere appreciation to the members of my thesis committee for their valuable insights, critical engagement with my research, and the time they generously invested in reviewing this work. Your contributions significantly strengthened the quality of this thesis."),
  body("To the entire faculty of the Department of Information and Communication Technology at The ICT University, I am grateful for the knowledge, mentorship, and academic foundation you provided throughout my studies. You did not merely teach me a subject — you taught me how to think. The impact of your instruction extends far beyond these pages."),
  body("I am profoundly thankful to my late father, Pa Fonguh, whose belief in the transformative power of education shaped my entire academic path. Though he is no longer with us, his voice and values remain a constant compass. To my dear mother, Mami Fonguh, who sacrificed in ways both visible and invisible to ensure I could pursue this degree — your love and support have been my greatest source of strength. I could not have done this without you. To my siblings, thank you for the stability, encouragement, and laughter you brought into what were often challenging seasons."),
  body("To my friends and colleagues who walked alongside me through long nights of research, shared ideas across cluttered tables, and never allowed me to surrender to discouragement — your companionship made this journey not only bearable, but meaningful. I am grateful for every conversation, every word of encouragement, and every shared moment of both frustration and breakthrough."),
  body("To anyone I may not have mentioned by name — your kindness and support did not go unnoticed. Every act of encouragement, however small, contributed to the completion of this work. Thank you."),
];

const facultyApproval = [
  pageBreak(),
  h1("FACULTY APPROVAL"),
  body("This dissertation has been duly reviewed by the Department and the Faculty and is ready for examination with our approval."),
  blank(),
  body("Approved by"),
  blank(), blank(),
  body("Signature                                                                          Date"),
  body("____________________________"),
  body("                                                                                                Engr. Moune"),
  body("                                                                                                Supervisor"),
  blank(), blank(),
  body("Signature                                                                          Date"),
  body("____________________________"),
  body("                                                                                                Engr. XXXXXXXXXXXXXXX"),
  body("                                                                                                Head of Department"),
  blank(), blank(),
  body("Signature                                                                          Date"),
  body("____________________________"),
  body("                                                                                                Engr. XXXXXXXXXXXXXXX"),
  body("                                                                                                Dean"),
];

const abstract = [
  pageBreak(),
  h1("ABSTRACT"),
  body("In Cameroon, njangi (also known as tontine) is a traditional savings mobilisation system where group members voluntarily pool money to support each other and finance small businesses (Forje, 2014). However, many njangi groups still rely on manual, paper-based records and informal agreements, which creates trust problems, late payments, lack of transparency, weak documentation, and exposes members to fraud and mismanagement (Forje, 2014). This study aims to design and implement a secure mobile-based njangi management system — Mbole Pay — that improves transparency, record keeping, and payment discipline for group members."),
  body("A survey of 72 respondents comprising students and workers, mostly aged 18–25 and regular smartphone users, was conducted to understand current njangi practices, challenges, and user expectations for a digital solution. Survey insights guided requirements gathering and system design, leading to the implementation of a mobile njangi application featuring automated payment reminders, integration with MTN Mobile Money (MoMo), transparent transaction histories, smart contract enforcement of group rules, and tools for monitoring member contributions and payouts."),
  body("The survey revealed high participation and familiarity with njangi, with most respondents currently or previously belonging to at least one njangi group. The main reported problems were trust issues, late payments, treasurers or members collecting payouts and abandoning the group, and poor tracking of contributions, confirming the weaknesses of informal, paper-based systems. Respondents expressed strong interest in a digital solution offering automated reminders, clear visibility of who has paid, downloadable records, fixed group rules, and integration with mobile money and formal payment providers."),
  body("In the system evaluation, users rated the prototype as easy to use and useful for tracking payments and enforcing agreed rules. Performance tests showed acceptable response times for typical group sizes. Overall, a secure mobile njangi application can address key weaknesses of traditional njangi groups by improving transparency, trust, and payment discipline, particularly in contexts where informal savings systems are widely used but poorly documented (Forje, 2014). To achieve wide adoption, the system prioritises strong security, low data usage, a simple user interface, and seamless integration with existing mobile money services. Future work will extend the approach to rural users and explore additional savings and credit services built on the platform's smart contract infrastructure."),
];

const toc = [
  pageBreak(),
  h1("TABLE OF CONTENTS"),
  body("DECLARATION ................................................................................................ i"),
  body("CERTIFICATION .............................................................................................. ii"),
  body("DEDICATIONS ................................................................................................ iii"),
  body("ACKNOWLEDGEMENTS .................................................................................... iv"),
  body("FACULTY APPROVAL ....................................................................................... v"),
  body("ABSTRACT .................................................................................................... vi"),
  body("TABLE OF CONTENTS ..................................................................................... vii"),
  body("LIST OF TABLES ............................................................................................. ix"),
  body("LIST OF FIGURES ........................................................................................... x"),
  body("LIST OF ACRONYMS AND ABBREVIATIONS ........................................................ xi"),
  blank(),
  body("CHAPTER 1: INTRODUCTION TO THESIS ............................................................ 1"),
  body("    1.1 Introduction ........................................................................................ 1"),
  body("    1.2 Background to the Problem ................................................................... 2"),
  body("    1.3 Problem Statement ............................................................................... 4"),
  body("    1.4 Objectives of the Study ........................................................................ 5"),
  body("    1.5 Research Questions .............................................................................. 6"),
  body("    1.6 Significance of the Study ...................................................................... 7"),
  body("    1.7 Scope of the Study ............................................................................... 8"),
  body("    1.8 Limitations of the Study ........................................................................ 9"),
  body("    1.9 Organization of the Study ..................................................................... 9"),
  blank(),
  body("CHAPTER 2: LITERATURE REVIEW ................................................................... 10"),
  body("    2.1 Informal Savings and Njangi/Tontine in Cameroon ................................ 10"),
  body("    2.2 Challenges of Informal Saving Groups .................................................. 12"),
  body("    2.3 Digitisation and Mobile Platforms for Group Savings ............................. 14"),
  body("    2.4 Linking Informal Groups to Formal and Digital Finance .......................... 17"),
  body("    2.5 Gaps and Implications for a Mobile Njangi System ................................ 18"),
  body("    2.6 Legal and Regulatory Framework ......................................................... 19"),
  blank(),
  body("CHAPTER 3: METHODOLOGY .......................................................................... 22"),
  body("    3.1 Research Design .................................................................................. 22"),
  body("    3.2 Data and Requirements Gathering ........................................................ 23"),
  body("    3.3 Population and Sample ......................................................................... 24"),
  body("    3.4 Instruments ........................................................................................ 25"),
  body("    3.5 Data Analysis ...................................................................................... 25"),
  body("    3.6 Processes, Methods, Techniques, and Tools .......................................... 26"),
  body("    3.7 Prototype Evaluation ........................................................................... 28"),
  blank(),
  body("CHAPTER 4: SYSTEM DESIGN, IMPLEMENTATION AND RESULTS ......................... 29"),
  body("    4.1 Overview of the Chapter ...................................................................... 29"),
  body("    4.2 Data Presentation and Statistical Analysis ............................................. 29"),
  body("    4.3 Requirements Analysis and System Specification .................................. 40"),
  body("    4.4 System Design ..................................................................................... 44"),
  body("    4.5 System Implementation ....................................................................... 50"),
  body("    4.6 Testing and Results .............................................................................. 56"),
  body("    4.7 Summary of the Chapter ...................................................................... 59"),
  blank(),
  body("CHAPTER 5: SUMMARY, CONCLUSIONS, DISCUSSION AND RECOMMENDATIONS . 60"),
  body("    5.1 Introduction ........................................................................................ 60"),
  body("    5.2 Summary of the Study ......................................................................... 60"),
  body("    5.3 Conclusions ........................................................................................ 63"),
  body("    5.4 Discussion .......................................................................................... 65"),
  body("    5.5 Recommendations ............................................................................... 67"),
  body("    5.6 Summary ............................................................................................ 69"),
  blank(),
  body("REFERENCES ................................................................................................ 70"),
  body("ANNEXES ..................................................................................................... 72"),
];

const listOfTables = [
  pageBreak(),
  h1("LIST OF TABLES"),
  body("Table 3.1:  Summary of data collection methods used in the study .................. 24"),
  body("Table 4.1:  Age distribution of survey respondents ........................................ 30"),
  body("Table 4.2:  Gender distribution of survey respondents ................................... 30"),
  body("Table 4.3:  Smartphone and internet access among respondents ..................... 31"),
  body("Table 4.4:  Njangi group participation status ................................................. 32"),
  body("Table 4.5:  Reported challenges in traditional njangi operations ..................... 33"),
  body("Table 4.6:  Most desired features in a digital njangi application ..................... 35"),
  body("Table 4.7:  Factors that would build trust in a digital njangi system ............... 36"),
  body("Table 4.8:  Willingness to pay for the application ......................................... 37"),
  body("Table 4.9:  Functional requirements specification summary ............................ 41"),
  body("Table 4.10: Non-functional requirements specification summary ..................... 43"),
  body("Table 4.11: Core database tables and their purposes ..................................... 52"),
  body("Table 4.12: Smart contract core functions ..................................................... 54"),
  body("Table 4.13: System test cases and results ..................................................... 57"),
  body("Table 4.14: Performance test results under typical load ................................ 58"),
];

const listOfFigures = [
  pageBreak(),
  h1("LIST OF FIGURES"),
  body("Figure 4.1:  Age distribution of respondents ................................................. 30"),
  body("Figure 4.2:  Gender distribution of respondents ............................................ 31"),
  body("Figure 4.3:  Smartphone and internet access ................................................. 31"),
  body("Figure 4.4:  Njangi participation status ........................................................ 32"),
  body("Figure 4.5:  Reported challenges in traditional njangi systems ....................... 33"),
  body("Figure 4.6:  Transparency and record-keeping features requested ................... 34"),
  body("Figure 4.7:  Preferred features for contribution management ......................... 35"),
  body("Figure 4.8:  Willingness to use the application ............................................. 36"),
  body("Figure 4.9:  Factors that increase trust in a mobile njangi app ...................... 37"),
  body("Figure 4.10: Acceptance of transaction and service fees ................................ 38"),
  body("Figure 4.11: Willingness to pay for premium features .................................... 38"),
  body("Figure 4.12: Intention to recommend the app to njangi groups ...................... 39"),
  body("Figure 4.13: Use case diagram of the njangi management system .................. 45"),
  body("Figure 4.14: Class diagram of the njangi management system ........................ 46"),
  body("Figure 4.15: Sequence diagram for the contribution and payout process ......... 47"),
  body("Figure 4.16: Activity diagram for dispute resolution ..................................... 48"),
  body("Figure 4.17: High-level system architecture (deployment diagram) ................ 49"),
  body("Figure 4.18: Entity-Relationship (ER) diagram of the database ...................... 53"),
  body("Figure 4.19: Login and registration screen of the Mbole Pay app ................... 55"),
  body("Figure 4.20: Group dashboard and contribution tracking screen ..................... 55"),
];

const acronyms = [
  pageBreak(),
  h1("LIST OF ACRONYMS AND ABBREVIATIONS"),
  twoColTable([
    ["Acronym", "Meaning"],
    ["AML/CFT", "Anti-Money Laundering / Counter-Terrorism Financing"],
    ["API", "Application Programming Interface"],
    ["ASCAs", "Accumulating Savings and Credit Associations"],
    ["BEAC", "Banque des États de l'Afrique Centrale"],
    ["BSC", "Binance Smart Chain"],
    ["CEMAC", "Communauté Économique et Monétaire de l'Afrique Centrale"],
    ["CI/CD", "Continuous Integration / Continuous Deployment"],
    ["CID", "Content Identifier (IPFS)"],
    ["CMGs", "Community Mutual Groups"],
    ["COBAC", "Commission Bancaire de l'Afrique Centrale"],
    ["DGI", "Directorate General of Taxes (Cameroon)"],
    ["GDPR", "General Data Protection Regulation"],
    ["IaC", "Infrastructure as Code"],
    ["IPFS", "InterPlanetary File System"],
    ["ISGs", "Informal Savings Groups"],
    ["JWT", "JSON Web Token"],
    ["K8s", "Kubernetes"],
    ["KYC", "Know Your Customer"],
    ["MFA", "Multi-Factor Authentication"],
    ["MFI", "Microfinance Institution"],
    ["MINFI", "Ministry of Finance (Cameroon)"],
    ["MoMo", "MTN Mobile Money"],
    ["MVC", "Model-View-Controller"],
    ["OTP", "One-Time Password"],
    ["PCI-DSS", "Payment Card Industry Data Security Standard"],
    ["PWA", "Progressive Web App"],
    ["REST", "Representational State Transfer"],
    ["ROSCAs", "Rotating Savings and Credit Associations"],
    ["SaaS", "Software as a Service"],
    ["SDLC", "Software Development Life Cycle"],
    ["SQL", "Structured Query Language"],
    ["STR", "Suspicious Transaction Report"],
    ["TLS", "Transport Layer Security"],
    ["UAT", "User Acceptance Testing"],
    ["UML", "Unified Modelling Language"],
    ["WCAG", "Web Content Accessibility Guidelines"],
    ["XAF", "CFA Franc (Central African CFA franc)"],
  ], true),
];

// ─── CHAPTER 1 ────────────────────────────────────────────────────────────────
const chapter1 = [
  pageBreak(),
  h1("CHAPTER 1: INTRODUCTION TO THESIS"),
  h2("1.1 Introduction"),
  body("Across the globe, community-based savings mechanisms have served as vital instruments of financial inclusion for populations that lack access to formal banking services. In sub-Saharan Africa, these mechanisms take many forms — rotating savings and credit associations (ROSCAs), accumulating savings and credit associations (ASCAs), community mutual groups (CMGs), and informal savings groups (ISGs) — all of which enable households to smooth consumption, cope with financial shocks, and finance small enterprises (Wambua & Wamuyu, 2020). Within the specific context of Cameroon and the broader Central African region, the dominant expression of this phenomenon is the njangi, also referred to as tontine, a traditional system through which groups of individuals voluntarily pool their financial resources and distribute them, in rotation, to each participating member."),
  body("The njangi is not merely a financial product; it is deeply embedded in the social and cultural fabric of Cameroonian communities. It functions as a mechanism of mutual trust, social accountability, and collective solidarity. Members contribute fixed amounts at regular intervals — weekly, fortnightly, or monthly — and each cycle, the pooled total is disbursed to one designated member. The process rotates until every member has received the communal payout at least once. In its social lending variant, members may also borrow from the collective fund at agreed interest rates, making the njangi a dual instrument of both savings mobilisation and informal credit provision (Besin-Mengla, 2020)."),
  body("Despite the profound utility of the njangi in the Cameroonian economic landscape, the operational mechanisms sustaining it have remained almost entirely informal and analogue. Contributions are tracked in handwritten ledgers, verbal agreements underpin financial obligations, and the scheduling of payouts depends heavily on the memory and goodwill of a designated treasurer or group leader. This informality renders the system vulnerable to a range of failures: records can be lost or falsified, funds can be misappropriated, disputes arise frequently, and members who have already received their payout sometimes default on future contributions, leaving the group financially exposed (Ndiege et al., 2025)."),
  body("The growing penetration of mobile telephony and digital financial services in sub-Saharan Africa has created unprecedented conditions for addressing these challenges through technology. In Cameroon specifically, mobile money services such as MTN Mobile Money (MoMo) and Orange Money have achieved significant market penetration, offering a ready infrastructure for digital payments that bypasses the traditional banking system entirely (Ky et al., 2021). Simultaneously, the rapid diffusion of affordable smartphones among younger, urban Cameroonian populations has lowered the barriers to adopting web and mobile applications for everyday financial management."),
  body("It is within this broader context that Mbole Pay is conceived — a secure, mobile-based njangi management system designed to digitise and automate the core operational functions of njangi groups in Cameroon. By replacing paper ledgers with a structured digital database, manual payment collection with automated mobile money integration, and informal verbal agreements with smart contract-enforced rules, Mbole Pay aims to address the trust deficit and operational inefficiencies that plague traditional njangi operations while preserving the social and cultural dimensions that make the njangi indispensable to its participants."),
  body("This chapter introduces the study, providing background to the problem under investigation, a clear statement of the research problem, the objectives and research questions guiding the study, its significance, scope, and limitations, and a description of how the remaining chapters are organised."),

  h2("1.2 Background to the Problem"),
  body("The njangi/tontine system in Cameroon has its roots in centuries-old traditions of communal solidarity and mutual aid. Its contemporary forms, however, have expanded beyond village communities to encompass urban professional networks, church groups, workplace associations, and student societies (Forje, 2014). The system's versatility and cultural resonance have made it a primary financial instrument for populations ranging from market traders in Douala to civil servants in Yaoundé, and it is estimated that a substantial proportion of the Cameroonian working population participates in at least one njangi group at any given time."),
  body("Empirical evidence consistently identifies trust and transparency as the central operational challenges of traditional njangi groups. The absence of real-time, tamper-proof records means that disputes about who has paid, how much is in the collective pool, and who is next in the payout queue are common and sometimes irresolvable. Forje (2014) documented cases in which group treasurers absconded with pooled funds, leaving contributing members without recourse. More commonly, members who have received their payout simply reduce or cease contributions, exploiting the limited enforcement mechanisms available to the group."),
  body("The consequences of these failures extend beyond the immediate financial losses sustained by individual members. They erode the social trust that is both the foundation and the primary enforcement mechanism of the njangi system. Once trust is damaged, groups often dissolve prematurely, depriving members of both their expected financial benefit and the social solidarity that the njangi facilitates (Johnson, 2021). This cycle of dissolution and reformation — as former participants attempt to reconstitute groups with new members — represents a significant inefficiency in what is otherwise a highly effective informal financial instrument."),
  body("International evidence from comparable settings suggests that digital platforms can substantially mitigate these challenges. Experimental research conducted in the Democratic Republic of Congo demonstrated that mobile money-linked eROSCAs achieved high contribution rates and successful completion cycles, indicating that the social contract underlying group savings can be preserved and even strengthened through digital intermediation (François & Squires, 2021). A smartphone-based digital ROSCA tested in Pakistan showed that digitisation reduced the incidence of late payments and recording errors while simultaneously generating payment histories that could be leveraged for formal credit assessment (Mehmood, 2018). Research in Tanzania documented that purpose-built mobile applications co-created with women's savings groups improved record keeping, loan planning, and fund monitoring, while the MKOBA platform was shown to enhance member convenience, investment visibility, and loan access in community microfinance groups (Ndiege et al., 2025)."),
  body("In Cameroon, a small number of commercial applications have attempted to address the njangi digitisation gap. Platforms such as Tontiin and Mynjangi offer basic digital management functionality for njangi groups. However, these applications have not been systematically described, independently evaluated, or documented in the peer-reviewed academic literature, making it difficult to assess their effectiveness or to identify design lessons applicable to new systems (Wambua & Wamuyu, 2020). Furthermore, none of these platforms has been designed with the explicit integration of blockchain-based smart contracts to enforce group rules automatically — a feature that would eliminate the reliance on individual trustworthiness that is the single greatest vulnerability of the traditional njangi."),
  body("Within this landscape, the development of Mbole Pay responds to a clear and documented need: a rigorously designed, empirically evaluated, and locally contextualised mobile njangi management system that leverages mobile money integration, smart contract enforcement, and transparent digital record keeping to address the operational and trust-related failures of traditional njangi practice. The system is designed primarily for urban and peri-urban Cameroonian njangi participants who already own smartphones — a population that is growing rapidly and that exhibits both the digital readiness and the financial motivation to adopt such a solution."),

  h2("1.3 Problem Statement"),
  body("Despite the njangi's crucial role in mobilising household savings and financing small enterprises in Cameroon, most njangi groups continue to depend on paper ledgers, informal verbal agreements, and cash-only transactions. This situation exposes members to the risks of inaccurate or lost records, mismanagement of funds, delayed or missed contributions and payouts, unresolved disputes, and weak visibility to formal financial institutions that could otherwise offer complementary credit and insurance products (Ndiege et al., 2025)."),
  body("Existing commercial applications in Cameroon — Tontiin and Mynjangi — aim to digitise njangi practice, but they have not been systematically described, evaluated, or documented in the academic literature. Current research primarily examines ROSCA-style platforms and generic informal savings applications in other countries, without addressing the specific institutional, cultural, and technological context of Cameroonian njangi groups. Critically, no available platform combines mobile money integration with smart contract-based rule enforcement in a manner designed specifically for the njangi context."),
  body("Accordingly, this study addresses the core problem of the absence of a secure, mobile-based njangi management system that: (a) enhances transparency and accuracy of group financial records; (b) strengthens contribution and repayment discipline through automated reminders and smart contract enforcement; (c) provides a fair, anonymous, and auditable mechanism for resolving disputes; and (d) facilitates the gradual integration of njangi members into broader digital financial ecosystems in Cameroon."),
  body("This gap justifies the design, implementation, and evaluation of a prototype njangi management application — Mbole Pay — informed by both international evidence on digital informal savings groups and the specific needs and practices of Cameroonian njangi participants as identified through primary user research."),

  h2("1.4 Objectives of the Study"),
  h3("1.4.1 General Objective"),
  body("To design and implement a secure mobile-based njangi management system that improves transparency, record-keeping, and payment discipline for njangi groups in Cameroon, drawing on lessons from digital interventions for informal saving groups in comparable contexts."),
  h3("1.4.2 Specific Objectives"),
  numbered("To examine current practices, challenges, and digital readiness among njangi participants in Cameroon, in light of documented issues in informal saving groups such as mismanagement, delayed payments, and exclusion from formal services (Ndiege et al., 2025)."),
  numbered("To derive and specify functional and non-functional requirements for a mobile njangi system that supports secure transactions, transparent records, and integration with mobile money, building on features proven useful in other digital group platforms (Juma et al., 2025)."),
  numbered("To design and implement a prototype mobile njangi application — Mbole Pay — that operationalises these requirements and supports core group operations including member registration, contribution scheduling, automated payouts, dispute resolution, and reporting."),
  numbered("To evaluate the usability, perceived usefulness, and performance of the prototype with njangi users, and to explore its potential role in linking njangi groups with formal digital financial services, inspired by eROSCAs, digital group accounts, and platforms such as MKOBA (Johnson, 2021)."),

  h2("1.5 Research Questions"),
  body("Based on the objectives stated above, the following research questions guide the study:"),
  numbered("What are the main operational, trust, and record-keeping challenges facing njangi groups in Cameroon, and how do these compare to challenges documented in informal saving groups in other contexts?"),
  numbered("Which mobile-based features and design principles — such as inclusive interfaces, real-time monitoring, and linkage to mobile money — are most appropriate for addressing these challenges in the Cameroonian njangi context?"),
  numbered("How do njangi users perceive the usability, trustworthiness, and benefits of a mobile njangi system, in light of evidence from eROSCAs, mobile platforms such as MKOBA and WanawakeApp, and existing commercial njangi apps in Cameroon?"),

  h2("1.6 Significance of the Study"),
  body("This study is significant for several reasons, spanning both academic contribution and practical impact."),
  body("Academically, the study extends existing research on mobile applications for ROSCAs and community mutual groups by focusing on a njangi-specific design and by exploring the integration of blockchain-based smart contracts with local mobile money infrastructure. The majority of empirical work on digital savings group platforms has been conducted in East Africa (Tanzania, Kenya) and South Asia (Pakistan), and the findings from these contexts are not automatically transferable to the specific cultural, institutional, and regulatory environment of Cameroon and the CEMAC zone. By producing a rigorously documented, empirically evaluated prototype grounded in primary user research from Cameroonian njangi participants, this study contributes original evidence to a literature that is currently thin on Central African case studies."),
  body("Practically, the findings and the Mbole Pay prototype have potential value for several stakeholder groups. Njangi group members and administrators can benefit directly from the improved transparency, automation, and dispute resolution mechanisms that the system provides. Mobile money operators — particularly MTN Cameroon — gain a potential new use case for MoMo that deepens engagement among users who currently interact with the platform primarily for basic peer-to-peer transfers. Microfinance institutions can leverage the transaction histories generated by Mbole Pay as a data basis for credit scoring and product development targeting the currently underserved njangi participant population. Policymakers and regulators, including COBAC and the Cameroonian Ministry of Finance, can draw on the regulatory analysis presented in this study to inform the development of a clearer legal framework for digital njangi platforms that currently operate in a legal grey area. Finally, software developers and entrepreneurs considering entry into the Cameroonian fintech space can use the system design, technology choices, and user research findings presented here as a foundation for further innovation."),
  body("Beyond Cameroon, the findings of this study have relevance for the broader sub-Saharan African context, where similar informal savings group mechanisms are widespread and where mobile money infrastructure is developing rapidly. The design principles, regulatory insights, and empirical evidence generated by this study can inform analogous digitisation initiatives in neighbouring CEMAC countries and across the wider African continent."),

  h2("1.7 Scope of the Study"),
  body("The scope of this study is defined across three dimensions: thematic, geographic, and technical."),
  body("Thematically, the study focuses on the digitisation of the core operational functions of njangi groups, specifically: member registration and authentication, group creation and rule configuration, contribution collection and tracking, payout scheduling and execution, dispute raising and resolution, and notification and reporting. It does not extend to the macro-level impact of njangi digitisation on the Cameroonian financial sector, nor does it seek to replace or replicate the full range of services offered by formal microfinance institutions."),
  body("Geographically, the study focuses on urban and peri-urban njangi groups in Cameroon, primarily in the Centre (Yaoundé) and Littoral (Douala) regions, which are the most densely populated and most digitally connected areas of the country. The user research sample, while drawn from a broader online network, is predominantly composed of participants from these regions. The study does not claim to represent the practices or needs of rural or remote njangi groups, which may have significantly different connectivity constraints, digital literacy levels, and operational norms."),
  body("Technically, the study encompasses the full software development lifecycle from requirements elicitation through system design, implementation, and evaluation, but produces a prototype rather than a fully production-ready, commercially deployed system. The prototype demonstrates core functionality and validates the technical feasibility of the proposed approach; it does not include complete security hardening, regulatory licensing, or the infrastructure scale required for commercial deployment. In terms of blockchain integration, the study implements Solidity smart contracts targeting the Binance Smart Chain (BSC) testnet rather than the BSC mainnet, due to gas cost considerations during prototype development."),

  h2("1.8 Limitations of the Study"),
  body("Every research study operates within constraints that shape the scope and generalisability of its findings. The following limitations are acknowledged for this study."),
  body("First, the study sample, while adequate for requirements elicitation and prototype evaluation, may not be representative of the full demographic diversity of Cameroonian njangi participants. The sample is predominantly composed of young adults (77.8% aged 18–25) with smartphone access and internet connectivity, recruited through social media and online messaging channels. Older participants, rural residents, and individuals with limited digital literacy are underrepresented. As a result, the requirements and design decisions derived from the survey may be more relevant to digitally ready, urban njangi participants than to the broader population."),
  body("Second, the prototype evaluation was conducted over a short period with a limited number of participants. Long-term impacts on contribution discipline, default rates, dispute frequency, and group survival rates cannot be assessed within the timeframe of this study and would require longitudinal field research with live njangi groups."),
  body("Third, the blockchain implementation targets the BSC testnet rather than the mainnet. While the smart contract logic has been designed and tested, the operational costs, throughput constraints, and regulatory implications of mainnet deployment have not been empirically validated within the scope of this study."),
  body("Fourth, the regulatory and compliance landscape for digital njangi platforms in Cameroon and the CEMAC zone is still evolving. The regulatory analysis presented in Chapter 2 reflects the author's best interpretation of applicable laws and regulations as of the time of writing, but this analysis should not be taken as formal legal advice."),

  h2("1.9 Organization of the Study"),
  body("This dissertation is organised into five chapters, each building on the previous to construct a coherent account of the research problem, methodology, findings, and conclusions."),
  body("Chapter 1 has presented the introduction, background to the problem, statement of the problem, research objectives and questions, significance of the study, scope, limitations, and this organisational overview."),
  body("Chapter 2 reviews the existing academic and grey literature related to the problem under investigation. It examines the role and operational characteristics of njangi/tontine groups in Cameroon and comparable contexts, the documented challenges of informal savings groups, the evidence base for digital and mobile-based interventions, the linkage between informal group savings and formal financial services, and the legal and regulatory framework governing digital financial platforms in Cameroon and the CEMAC zone."),
  body("Chapter 3 describes the research methodology in detail. It explains the applied research design adopted for the study, the data and requirements gathering techniques employed, the composition and selection of the study sample, the instruments used for data collection and system development, and the analytical and development processes, methods, techniques, and tools applied throughout the project."),
  body("Chapter 4 presents the execution of the methodology. It provides statistical analysis of the survey data, a detailed specification of the system requirements derived from that data, the UML-based system design artefacts, the implementation of the Mbole Pay prototype, and the results of functional and usability testing."),
  body("Chapter 5 synthesises the findings of the study. It presents a summary of the research, conclusions drawn from the findings in relation to the research questions, a discussion that interprets findings in the context of the broader literature, and recommendations for both practice and future research."),
];

// ─── CHAPTER 2 ────────────────────────────────────────────────────────────────
const chapter2 = [
  pageBreak(),
  h1("CHAPTER 2: LITERATURE REVIEW"),
  h2("2.1 Informal Savings and Njangi/Tontine in Cameroon"),
  body("Informal savings and credit mechanisms are among the oldest and most widespread financial institutions in human history. In the contemporary literature on development economics and financial inclusion, these mechanisms are categorised under the umbrella of informal savings groups (ISGs), with rotating savings and credit associations (ROSCAs) and accumulating savings and credit associations (ASCAs) representing the two principal organisational forms (Kim, 2021). ROSCAs, of which the njangi is a variant, are defined by the rotation of a pooled fund among a fixed set of contributors, with each member receiving the total pool once per complete cycle. ASCAs, by contrast, accumulate funds over time and lend them to members with interest, functioning more like a miniature cooperative bank."),
  body("In Cameroon, the njangi — also referred to as tontine in the Francophone regions and as djangui or meeting in various Anglophone communities — occupies a central position in the domestic financial architecture. As Forje (2014) documented in a landmark study on domestic savings mobilisation and small business creation in Cameroon, the njangi system is not merely a savings tool; it is a social institution that reinforces communal bonds, distributes risk across social networks, and provides informal social insurance for members facing unexpected financial shocks. The njangi operates across all social strata in Cameroon, from market women in Douala's Marché Central to civil servants in Yaoundé's administrative districts, and from university student associations to professional networks in the financial and legal sectors."),
  body("The economic significance of the njangi in Cameroon should not be underestimated. In a context where formal bank account penetration remains limited and where microfinance institutions have not yet achieved broad coverage of the low- and middle-income population, the njangi functions as the primary savings and credit vehicle for a substantial proportion of the economically active population. Forje (2014) estimated that njangi-type mechanisms mobilise billions of CFA francs annually across Cameroon, representing a significant informal financial infrastructure that operates largely outside the regulatory and statistical purview of the formal financial system."),
  body("The governance structure of njangi groups varies considerably across contexts, but several common features can be identified. Groups are typically formed around pre-existing social relationships — family, friendship, workplace, church, or neighbourhood — and membership is based on personal trust and mutual social obligation. The size of groups ranges from as few as three or four members to as many as fifty or more, though groups at the upper end of this range are typically subdivided into smaller functional units for operational purposes. Contribution amounts and frequencies are determined by group consensus at formation and are typically fixed for the duration of a cycle. The order of payout is either determined by lottery, by committee decision, or by a first-come, first-served registration system (Besin-Mengla, 2020)."),
  body("Johnson (2021) explored the relationship between njangi groups and microfinance institutions in Cameroon, demonstrating that group accounts maintained at microfinance institutions can strengthen the operational sustainability of tontine groups while simultaneously contributing to the growth of the MFIs themselves. This finding is significant for the design of Mbole Pay because it suggests that the digitisation of njangi operations should be conceived not as a replacement for formal financial relationships but as a bridge that facilitates their development. By generating auditable transaction histories, Mbole Pay creates the evidentiary foundation that could support tontine-MFI partnerships of the kind documented by Johnson (2021)."),

  h2("2.2 Challenges of Informal Saving Groups"),
  body("The literature on informal savings groups consistently identifies a set of recurring operational and governance challenges that limit their effectiveness and expose members to financial risk. Understanding these challenges in detail is essential both for appreciating the motivation for Mbole Pay's development and for evaluating the design decisions made in the course of the project."),
  body("The first and most fundamental challenge is the absence of reliable, tamper-proof record keeping. Most njangi groups in Cameroon track contributions and payouts in handwritten ledgers maintained by the group treasurer. These records are vulnerable to loss, damage, and deliberate falsification. In cases where the treasurer is also a contributor with a vested interest in the payout schedule, the scope for manipulation is significant. Even in the absence of deliberate fraud, transcription errors, illegible handwriting, and the loss of physical notebooks have all been documented as sources of financial disputes and group dissolution (Ndiege et al., 2025)."),
  body("The second challenge is contribution discipline. Even in groups with strong social bonds, members periodically fail to contribute on time, either because of genuine financial hardship or because they have prioritised competing financial obligations. The social pressure that normally enforces contribution discipline is weakest when contributions are made remotely — by mobile money transfer, for example — because the lack of physical co-presence reduces the immediate social cost of non-payment. Late or missed contributions delay payouts for members waiting in the queue, generating frustration and eroding trust."),
  body("The third challenge is the problem of post-payout default. A well-documented failure mode in ROSCA-type mechanisms is the tendency for members who have already received their payout to reduce or cease contributions, since their primary financial incentive to participate has been satisfied (Kim, 2021). In formal financial systems, this behaviour would be categorised as default and would have legal and credit consequences for the defaulting party. In informal njangi groups, the consequences are limited to social sanction and the possible dissolution of the group, which may be an acceptable cost for a member who has already received the pooled fund."),
  body("The fourth challenge is dispute resolution. Disputes in njangi groups typically arise from disagreements about contribution records, allegations of fund misappropriation, requests to change payout order, or claims that group rules have been violated. In the absence of verifiable records and established adjudication procedures, dispute resolution in traditional njangi groups relies almost entirely on social negotiation, which is slow, often inconclusive, and sometimes results in permanent group dissolution. Members who perceive the dispute resolution process as unfair or biased by the group administrator are likely to disengage from the group altogether."),
  body("Kim (2021) emphasised that these operational challenges are particularly acute for groups whose members are geographically dispersed — as is increasingly the case in urban contexts where members may live and work in different parts of a large city — or for groups that have grown beyond the size at which informal social monitoring is effective. In such contexts, digital tools are not merely convenient enhancements to existing practice; they are structural requirements for maintaining group coherence and operational integrity."),
  body("Mehmood et al. (2019) further demonstrated in the Pakistani context that digitisation has a measurable impact on contribution timeliness. In their digital ROSCA experiment, reminder notifications sent through the platform reduced the incidence of late payments by a statistically significant margin, suggesting that the automation of contribution reminders can substitute effectively for the social pressure that would normally be exerted in a face-to-face group meeting."),

  h2("2.3 Digitisation and Mobile Platforms for Group Savings"),
  h3("2.3.1 eROSCAs and Digital ROSCA Platforms"),
  body("The concept of the eROSCA — a digitally mediated rotating savings and credit association — has gained significant traction in the development finance literature over the past decade. François and Squires (2021) conducted a controlled experiment in the Democratic Republic of Congo in which mobile money networks were used to facilitate ROSCA cycles among groups of unbanked participants. The experiment demonstrated not only that digital ROSCAs can achieve contribution rates comparable to traditional face-to-face groups, but that the creation of a digital payment record functioned as a form of commitment mechanism that deterred post-payout default. Participants who had made their contributions through a documented digital channel showed greater reluctance to default on subsequent contributions than participants in control groups operating through informal cash channels."),
  body("This finding has direct implications for the design of Mbole Pay. By routing all contributions through MTN MoMo or other digital payment channels and recording each transaction on both the platform database and the BSC blockchain, Mbole Pay creates an immutable public record of each member's contribution history. The existence of this record changes the incentive calculus for potential defaulters by raising the social and legal cost of non-payment: the evidence of default is permanent, public within the group, and potentially available to formal financial institutions that might otherwise be willing to extend credit to the defaulting member."),
  body("Mehmood (2018) and Mehmood et al. (2019) explored a comparable model in Pakistan, developing and testing a smartphone-based digital ROSCA application among low-income participants in urban Pakistan. Their findings echoed those of François and Squires (2021): digitisation reduced both recordkeeping errors and late payments, while the payment histories generated by the platform were used by participants to advocate for themselves in credit negotiations with formal financial institutions. This last finding is particularly relevant to the Cameroonian context, where informal sector workers and small business owners routinely face barriers to formal credit due to their inability to document their financial track records."),
  h3("2.3.2 Mobile Applications for Informal Savings Groups"),
  body("Beyond the specific eROSCA model, a broader literature documents the deployment of mobile applications to support informal savings groups of various types. Wambua and Wamuyu (2020) developed and evaluated a mobile application for ROSCAs and ASCAs in Kenya using an agile development methodology, finding that mobile applications can effectively address the transaction challenges that limit informal savings group efficiency. Their work highlighted the importance of designing for the specific operational workflows of the target groups rather than adapting generic financial management applications."),
  body("Ndiege et al. (2025) examined two specific applications — WanawakeApp and MKOBA — deployed among women's savings groups and community microfinance groups in Tanzania. The WanawakeApp study found that while the application improved record keeping and loan management, its adoption was shaped by a complex interplay of device access, connectivity costs, sociocultural norms around women's use of technology, and the digital literacy levels of both members and group leaders. The MKOBA study, by contrast, documented significant improvements in convenience, investment visibility, loan management, and financial security, suggesting that when design and deployment conditions are well-matched to user needs and capabilities, mobile savings applications can deliver substantial and measurable benefits."),
  body("A consistent theme across the literature is the importance of designing for the specific social and institutional context of the target group. Generic financial management applications, even well-designed ones, often fail to gain traction with informal savings groups because they do not map onto the specific operational workflows and social dynamics of ROSCA-type mechanisms. This observation informed several key design decisions in Mbole Pay, including the implementation of a payout queue that reflects the specific sequencing logic of traditional njangi groups, and the anonymous voting mechanism for dispute resolution that mirrors the social convention of collective decision-making in njangi group meetings."),
  h3("2.3.3 Smart Contracts and Decentralised Finance"),
  body("The application of blockchain-based smart contracts to informal savings group management represents a frontier of innovation that has attracted growing attention from both academic researchers and fintech practitioners. Smart contracts are self-executing programs stored on a blockchain that automatically enforce the terms of an agreement when pre-specified conditions are met, without requiring the intervention of a trusted intermediary. In the context of njangi management, smart contracts offer a potentially powerful mechanism for encoding group rules — contribution amounts, payout schedules, penalty terms — in a form that is transparent to all group members, immutable once agreed upon, and automatically executed without dependence on the honesty or competence of any individual group officer."),
  body("The Binance Smart Chain (BSC) was selected as the deployment target for Mbole Pay's smart contracts for several practical reasons. BSC is fully compatible with the Ethereum Virtual Machine (EVM), meaning that smart contracts can be written in Solidity and tested using the widely-used Hardhat development framework. Average gas fees on BSC are a fraction of those on the Ethereum mainnet — typically in the range of $0.01 to $0.10 per transaction, compared to $2 to $15 on Ethereum — making BSC a more realistic platform for financial transactions of the scale typical in Cameroonian njangi groups. Furthermore, Flutterwave and MTN MoMo have existing integrations with BSC-compatible systems, reducing the complexity of the payment gateway bridge required to link mobile money contributions to on-chain contract execution (Mbole Pay SRD v2, 2025)."),
  body("The use of smart contracts also addresses one of the fundamental weaknesses of traditional njangi groups: the dependence on the personal integrity of the group treasurer. In a smart contract-governed njangi, the rules of the group are encoded in the contract at inception and cannot be modified without a governance action — such as a unanimous member vote — that itself generates an on-chain record. The payout queue is maintained by the contract, and fund transfers are executed automatically when the contract logic determines that all conditions have been met. This removes the single point of failure represented by the human treasurer and replaces it with a cryptographically enforced rule set that is equally visible and equally binding on all participants."),

  h2("2.4 Linking Informal Groups to Formal and Digital Finance"),
  body("The literature identifies the linkage between informal savings groups and formal financial institutions as a particularly promising pathway toward financial inclusion for populations currently excluded from mainstream banking. Johnson (2021) documented this linkage empirically in the Cameroonian context, showing that tontine groups that maintained collective accounts at microfinance institutions exhibited greater operational sustainability and were better able to access supplementary credit products than groups operating entirely outside the formal system."),
  body("Ky et al. (2021) examined the broader relationship between mobile money and financial inclusion in sub-Saharan Africa, finding that mobile money adoption is positively associated with savings behaviour, access to credit, and the ability to manage financial shocks — particularly among lower-income and female-headed households. This finding underscores the importance of mobile money integration in any digital savings group platform targeting the Cameroonian market. By building MTN MoMo integration directly into the Mbole Pay contribution and payout workflows, the platform ensures that it is accessible to the large majority of target users who already interact with mobile money on a regular basis, while simultaneously positioning itself to benefit from the continued expansion of mobile money infrastructure in Cameroon."),
  body("The aspiration to generate formal financial records from informal savings activity — enabling njangi participants to build credit histories that could support access to formal loans, insurance, or other financial products — is a common thread across the literature (Mehmood et al., 2019; Wambua & Wamuyu, 2020; Johnson, 2021). Mbole Pay's dual storage architecture, in which transaction records are maintained in both a relational database and on the BSC blockchain, positions the platform to serve as a foundation for credit scoring and formal financial product development in future iterations."),

  h2("2.5 Gaps and Implications for a Mobile Njangi System"),
  body("Synthesising the evidence reviewed above, several gaps in the existing literature can be identified that this study seeks to address."),
  body("First, while the digitisation of ROSCAs has been studied in the DRC, Pakistan, Tanzania, and Kenya, no peer-reviewed study was found that designs, implements, or evaluates a njangi-specific mobile management system tailored to Cameroon's specific cultural, institutional, and regulatory context. The njangi is not simply a generic ROSCA; its specific operational conventions, social governance mechanisms, and regulatory environment have characteristics that distinguish it from the analogous mechanisms studied in other countries, and a system designed specifically for the njangi context can be expected to outperform generic ROSCA platforms in adoption and effectiveness."),
  body("Second, no existing study of digital savings group platforms integrates smart contract-based rule enforcement with mobile money contribution processing in the specific context of the Cameroonian njangi. The potential of this combination — immutable rule enforcement plus frictionless mobile money integration — to address the twin challenges of trust deficit and contribution discipline represents a novel contribution to both the technical and empirical literatures."),
  body("Third, while the legal and regulatory framework applicable to digital njangi platforms in Cameroon has been touched upon in broader discussions of COBAC regulation and Cameroonian cybersecurity law (Besin-Mengla, 2020), no study provides a systematic compliance analysis that maps the operational features of a digital njangi platform onto the specific regulatory requirements of the CEMAC zone. This study addresses this gap in Chapter 2 Section 2.6 and in the SRD developed as part of the project."),

  h2("2.6 Legal and Regulatory Framework"),
  h3("2.6.1 Legal Status of Njangi Groups in Cameroon"),
  body("In Cameroon, njangi groups operate primarily as informal civil associations governed by internal regulations agreed upon by their members, rather than as formally registered financial entities subject to specific regulatory oversight. The legal framework applicable to njangi groups is thus a composite of civil law (governing contracts and property rights among members), tax law (determining whether and how njangi income is taxable), anti-usury provisions in the Cameroon Penal Code, and the banking and electronic money regulations administered by COBAC (Besin-Mengla, 2020)."),
  h3("2.6.2 Tax Treatment of Njangi Activities"),
  body("The Directorate General of Taxes (DGI) of Cameroon has clarified that purely rotational njangi activities — in which members contribute to and receive from a common pool without any interest accruing on the pooled funds — are generally exempt from income tax. This exemption reflects the DGI's characterisation of the rotational payout as a return of the member's own contributions rather than an income event. However, njangi groups that engage in commercial lending, charge interest on loans made from the pooled fund, or conduct commercial activities as a group entity may be subject to income tax and value-added tax on those activities (Marie, 2021). Njangi groups that formalise as cooperatives or associations are additionally subject to transparency requirements regarding the source of group funds."),
  h3("2.6.3 Anti-Usury Provisions"),
  body("Section 325 of the Cameroon Penal Code (2016) prohibits usury — the charging of interest at rates exceeding the limits set by banking regulations administered by COBAC and BEAC. Njangi groups that include a lending component must ensure that any interest charged on intra-group loans does not exceed the legal limit set by CEMAC Regulation N°04/19, which governs the effective global rate (taux effectif global) applicable to credit transactions in the CEMAC zone (Règlement N°04/19, 2019). This provision has direct implications for the design of Mbole Pay's lending feature, if such a feature were to be included in future iterations of the platform."),
  h3("2.6.4 COBAC Regulation and Electronic Money"),
  body("The most significant regulatory consideration for a digital njangi platform is whether its operations trigger the regulatory requirements applicable to electronic money institutions (EMIs) under COBAC Regulation R-2009/02. If Mbole Pay were to hold user funds in a centrally controlled escrow account — as would be necessary if the platform were to process contributions and disbursements directly rather than routing them through a licensed payment gateway — it would be operating as an EMI and would require a COBAC licence or partnership with a COBAC-licensed entity before processing live transactions."),
  body("The SRD for Mbole Pay v2 (2025) recommends that the platform adopt a Software-as-a-Service (SaaS) model in which it functions as a technology intermediary that facilitates connections between group members and licensed payment gateways (MTN MoMo, Orange Money, Flutterwave, Paystack) rather than holding user funds directly. Under this model, Mbole Pay would collect a subscription or service fee for the provision of its management tools, while all financial flows would be processed by and subject to the regulatory oversight of licensed payment providers. This approach minimises the platform's direct regulatory exposure while preserving the core functionality of automated contribution collection, payout execution, and smart contract rule enforcement."),
  h3("2.6.5 Data Protection and Cybersecurity"),
  body("Cameroonian Law No. 2010/012 on cybersecurity and cybercrime establishes obligations for digital platforms operating in Cameroon with respect to the protection of user personal data, the security of electronic transactions, and the reporting of cyber incidents. For Mbole Pay, the most relevant provisions relate to the secure storage and processing of user personal data including identity documents uploaded for KYC verification, financial transaction records, and communications between group members. The law creates a preference for the storage of Cameroonian user data on servers physically located in Cameroon or a CEMAC country, though data transfer to non-CEMAC jurisdictions is permissible if appropriate data transfer agreements and encryption measures are in place (Mbole Pay SRD v2, 2025)."),
  body("Additionally, as a platform that processes payment card data through third-party gateways such as Flutterwave and Paystack, Mbole Pay must ensure that its integration with these gateways complies with PCI-DSS Level 4 standards. Specifically, Mbole Pay must not store, process, or transmit raw card data; all card tokenisation must be delegated to the payment gateway, with only the tokenised references retained in the Mbole Pay database."),
];

// ─── CHAPTER 3 ────────────────────────────────────────────────────────────────
const chapter3 = [
  pageBreak(),
  h1("CHAPTER 3: METHODOLOGY"),
  h2("3.1 Research Design"),
  body("This study adopts an applied research design that combines quantitative user research with a structured system development lifecycle. The decision to adopt an applied research design reflects the dual purpose of the study: to generate empirical evidence about the challenges and needs of Cameroonian njangi participants, and to apply that evidence in the design, implementation, and evaluation of a technological solution to those challenges."),
  body("The applied research design employed in this study is characterised by three interrelated phases. The first phase is empirical: a structured survey instrument is used to collect quantitative data from a sample of Cameroonian njangi participants and potential users, generating evidence about current practices, operational challenges, digital readiness, and feature preferences. The second phase is analytical and design-focused: the survey data, combined with a review of existing literature and documentation, is used to derive and specify a set of functional and non-functional requirements for the Mbole Pay system, which are then operationalised in a set of UML design artefacts. The third phase is developmental and evaluative: the design artefacts are implemented as a working prototype, which is then evaluated by a subset of potential users to assess its usability, perceived usefulness, and performance."),
  body("This three-phase design aligns with the guidelines of the ICT Department of The ICT University for Bachelor's dissertations, which advocate for research designs that embed quantitative analysis within an applied system development project (FICT Guidelines, 2023). It also reflects best practice in the literature on digital savings group platform development, in which user-centred requirements elicitation is consistently identified as a critical success factor (Ndiege et al., 2025; Wambua & Wamuyu, 2020)."),
  body("Within the system development phase, an Agile-inspired iterative development approach was adopted rather than a traditional waterfall model. Agile approaches are well-suited to applied research projects in which requirements may evolve as the developer gains deeper insight into user needs through the iterative development and testing process. The iterative approach allowed design artefacts to be refined in light of implementation insights and user feedback, producing a more responsive and user-aligned prototype than a single-pass waterfall methodology would have permitted."),

  h2("3.2 Data and Requirements Gathering"),
  body("Multiple complementary techniques were employed to gather the data and domain knowledge required to derive the system requirements for Mbole Pay. The primary data collection technique was an online questionnaire administered through Google Forms, supplemented by a review of existing documentation and informal interviews and observations of njangi practice."),
  h3("3.2.1 Online Questionnaire"),
  body("The primary instrument for empirical data collection was a structured questionnaire comprising 26 questions organised into five sections: participant demographics (Section A), njangi participation experience (Section B), pain points with the current system (Section C), interest in a digital solution (Section D), and open-ended feedback (Section E). The questionnaire was designed to collect both quantitative data amenable to descriptive statistical analysis (closed-ended multiple choice, Likert-scale, and checkbox questions) and qualitative data providing richer contextual insight (open-ended paragraph questions)."),
  body("The questionnaire was deployed online through Google Forms and distributed through WhatsApp messaging groups, social media platforms, and personal networks. The instrument was pre-tested with a small group of potential respondents to verify question clarity, and minor wording adjustments were made before full deployment. A total of 72 valid responses were collected over the deployment period."),
  h3("3.2.2 Review of Existing Documents and Applications"),
  body("To complement the primary survey data, a systematic review of existing documentation on informal savings groups, digital ROSCA platforms, and njangi management applications was conducted. Sources reviewed included: peer-reviewed academic journal articles and conference papers on digital savings group platforms (Francois & Squires, 2021; Mehmood et al., 2019; Ndiege et al., 2025; Wambua & Wamuyu, 2020); grey literature including financial regulation documents from COBAC and BEAC, Cameroonian legal texts including Law No. 2010/012 and Section 325 of the Penal Code, and CEMAC Regulation N°04/19; and available documentation on existing commercial njangi applications in Cameroon, specifically Tontiin and Mynjangi."),
  h3("3.2.3 Informal Interviews and Observations"),
  body("Informal discussions with current and former njangi members were conducted to supplement the quantitative survey data with qualitative contextual understanding of njangi operational practices. These discussions focused on how contributions are collected and recorded in practice, how the payout schedule is determined and communicated, what types of disputes arise most frequently, and how disputes are typically resolved. Observations of njangi meeting practices also informed the design of the user interface, particularly the group dashboard and contribution tracking screens."),

  h2("3.3 Population and Sample"),
  body("The target population for this study is defined as current and potential members of njangi/tontine groups in Cameroon who use, or are willing to use, smartphones for financial activities. This population is large and diverse, encompassing participants across all age groups, occupational categories, and geographic locations within Cameroon."),
  body("Given the online mode of survey deployment, a non-probability convenience sampling approach was adopted, in which the survey link was disseminated through social media platforms, WhatsApp messaging groups, and personal networks. This approach was selected on pragmatic grounds — specifically, the need to reach smartphone users quickly within the time and resource constraints of a Bachelor's research project — rather than on the basis of probabilistic representativeness. The resulting sample of 72 respondents is sufficient for the purpose of requirements elicitation and prototype evaluation, though it should not be interpreted as a statistically representative sample of the Cameroonian njangi participant population."),
  body("The demographic characteristics of the sample are described in detail in Chapter 4. In summary, the sample is predominantly composed of young adults aged 18–25 (77.8%), is more female than male (63.9% female, 36.1% male), is primarily composed of students and young professionals, and is concentrated in urban areas with reliable smartphone and internet access. While these characteristics limit the generalisability of the findings to the broader njangi population, they are well-matched to the characteristics of the early adopter population most likely to be the initial target users of a digital njangi management platform."),

  h2("3.4 Instruments"),
  body("The main data collection instrument was the 26-question structured questionnaire described in Section 3.2.1, implemented in Google Forms. For the system development component of the project, the primary instruments were: the System Requirements Document (SRD) v1 and v2, which formalised the functional and non-functional requirements derived from the survey data and literature review; a set of UML diagrams (use case diagram, class diagram, sequence diagram, activity diagram, and deployment diagram), produced using StarUML; and the implemented prototype codebase, which constitutes the primary artefact of the study."),

  h2("3.5 Data Analysis"),
  body("Survey data collected through Google Forms were exported to a spreadsheet application for quantitative analysis. The following analytical techniques were applied:"),
  body("Descriptive statistics: Frequencies and percentages were computed for all closed-ended survey questions. These statistics summarise the distribution of responses across the key variables of interest, including njangi participation status, smartphone and internet access, reported operational challenges, preferred application features, and willingness to adopt and pay for a digital platform."),
  body("Graphical presentation: Bar charts and pie charts were generated to visualise the distribution of responses. These visualisations support the interpretation of survey findings and are incorporated into Chapter 4 as labelled figures."),
  body("Requirement derivation: Quantitative findings were systematically mapped to functional and non-functional system requirements. For example, the finding that 91.2% of respondents requested automated contribution reminders was mapped directly to the functional requirement for an automated notification system; the finding that 78.9% wanted all payments to be visible and transparent was mapped to the requirement for a group dashboard providing real-time visibility of contribution status; and the finding that 68.4% requested mobile money integration was mapped to the requirement for MTN MoMo API integration in the contribution and payout workflows."),
  body("Cross-tabulation: Where relevant to the research questions, cross-tabulations were examined to explore relationships between variables, such as the relationship between njangi participation experience and willingness to adopt a digital platform."),

  h2("3.6 Processes, Methods, Techniques, and Tools"),
  h3("3.6.1 Development Process"),
  body("The system was developed following an Agile-inspired iterative development lifecycle comprising four main phases: requirements elicitation and analysis; system design; prototype implementation; and testing and evaluation. These phases were executed iteratively, with each iteration producing refinements to both the design artefacts and the implemented prototype based on new insights and feedback."),
  h3("3.6.2 Methods and Techniques"),
  body("The following methods and techniques were employed in the course of the project:"),
  bullet("Requirements engineering: Survey findings, literature review insights, and informal interview data were combined and processed using standard requirements engineering techniques to produce a structured set of functional and non-functional requirements documented in the SRD."),
  bullet("Unified Modelling Language (UML): UML was used to model the system's structure and behaviour. The following diagram types were produced: use case diagram (actors and system interactions), class diagram (entity structure and relationships), sequence diagrams (key interaction flows), activity diagram (dispute resolution process), and deployment diagram (physical architecture)."),
  bullet("Agile development: An iterative, sprint-based development approach was adopted, with features prioritised in a product backlog and implemented in successive iterations. This approach allowed the prototype to be refined continuously in light of implementation feedback."),
  bullet("Prototyping: An interactive prototype was produced and evaluated with a subset of potential users to validate requirements and gather usability feedback."),
  bullet("Smart contract development: Solidity smart contracts were developed and tested using the Hardhat development framework, targeting the Binance Smart Chain testnet."),
  h3("3.6.3 Development Tools and Languages"),
  body("The following tools and languages were employed in the implementation of the Mbole Pay prototype:"),
  twoColTable([
    ["Tool / Language", "Purpose"],
    ["React.js + TailwindCSS", "Frontend user interface — mobile-first, responsive web application"],
    ["Node.js + Express.js", "Backend API — REST endpoints, business logic, authentication"],
    ["PostgreSQL", "Primary relational database — user data, groups, contributions, payouts"],
    ["IPFS (via Pinata)", "Decentralised immutable storage — KYC documents, audit records"],
    ["Solidity + Hardhat", "Smart contract development and testing on BSC testnet"],
    ["Web3.js", "Backend-to-blockchain communication (JSON-RPC)"],
    ["Redis", "Message queuing for async payout scheduling and notifications"],
    ["Docker + Kubernetes", "Containerisation and container orchestration"],
    ["Terraform + Ansible", "Infrastructure as Code (IaC) for environment provisioning"],
    ["GitHub Actions", "CI/CD pipeline for automated build, test, and deployment"],
    ["AWS / GCP", "Cloud infrastructure hosting"],
    ["StarUML", "UML diagram creation"],
    ["Google Forms", "Survey instrument deployment and data collection"],
    ["Flutterwave / Paystack / MTN MoMo", "Payment gateway integrations for contributions and payouts"],
  ], true),

  h2("3.7 Prototype Evaluation"),
  body("To evaluate the implemented prototype, a subset of survey respondents and njangi group members were invited to interact with the Mbole Pay application. Participants were guided through the main workflows of the application — registration, group creation, contribution submission, and payout status checking — and were asked to complete follow-up questionnaires and short informal interviews assessing their experience."),
  body("The evaluation focused on three dimensions: usability, assessed through participants' ability to navigate the application and complete tasks without assistance; perceived usefulness, assessed through participants' self-reported views on whether the application would help address the trust, transparency, and payment-tracking challenges identified in the initial survey; and performance, assessed by measuring the response times for key operations under typical usage conditions."),
  body("Observed usability issues were recorded and prioritised for remediation in subsequent iterations of the prototype. Performance measurements were compared against the non-functional requirements specified in the SRD to assess whether the system met its performance targets."),
];

// ─── CHAPTER 4 ────────────────────────────────────────────────────────────────
const chapter4 = [
  pageBreak(),
  h1("CHAPTER 4: SYSTEM DESIGN, IMPLEMENTATION AND RESULTS"),
  h2("4.1 Overview of the Chapter"),
  body("This chapter presents the execution of the methodology described in Chapter 3. It is organised into the following sections: Section 4.2 presents the statistical analysis of the survey data collected from 72 respondents; Section 4.3 presents the requirements analysis and system specification derived from the survey data and literature review; Section 4.4 presents the UML-based system design artefacts; Section 4.5 describes the implementation of the Mbole Pay prototype; Section 4.6 presents the testing and evaluation results; and Section 4.7 provides a chapter summary."),

  h2("4.2 Data Presentation and Statistical Analysis"),
  h3("4.2.1 Description of the Sample"),
  body("A total of 72 respondents completed the online questionnaire. The demographic profile of the sample is summarised in Tables 4.1 and 4.2 and visualised in Figures 4.1 and 4.2."),
  body("Age distribution: The majority of respondents (77.8%, n=56) were aged between 18 and 25 years, reflecting the predominantly student and young professional composition of the sample. A further 13.9% (n=10) were aged 26–35 years, with the remaining respondents distributed across older age groups. The concentration of younger respondents is consistent with the online recruitment methodology, which reached participants through social media and messaging platforms disproportionately used by younger Cameroonians."),
  body("Gender distribution: The sample was more female than male, with 63.9% (n=46) identifying as female and 36.1% (n=26) as male. This distribution is broadly consistent with the pattern observed in studies of ROSCA participation in comparable contexts, in which women tend to be the primary participants in informal savings mechanisms (Kim, 2021)."),
  body("Occupational distribution: The largest occupational category represented in the sample was students (approximately 55%), followed by employed individuals in the private sector and civil servants. A smaller proportion identified as self-employed or small business owners."),
  body("Geographic distribution: Respondents were predominantly located in the Centre region (Yaoundé) and the Littoral region (Douala), consistent with the concentration of urban smartphone users in these two major cities."),
  blank(),
  threeColTable([
    ["Age Group", "Number of Respondents", "Percentage"],
    ["18–25 years", "56", "77.8%"],
    ["26–35 years", "10", "13.9%"],
    ["36–45 years", "4", "5.5%"],
    ["46+ years", "2", "2.8%"],
    ["Total", "72", "100%"],
  ], true),
  body("Table 4.1: Age distribution of survey respondents"),
  blank(),

  h3("4.2.2 Smartphone and Internet Access"),
  body("Among the 72 respondents, 77.8% (n=56) reported owning a smartphone with reliable internet access. A further 22.2% (n=16) owned a smartphone but reported limited or expensive internet connectivity. No respondents reported lacking a smartphone entirely, which is consistent with the online recruitment methodology but should be noted as a potential source of selection bias: individuals without smartphone access are, by definition, not represented in the sample."),
  body("This finding indicates that the Mbole Pay prototype, designed as a smartphone-based web application, would be accessible to the large majority of the survey sample. The 22.2% of respondents with limited or expensive internet access represent an important design consideration, motivating the progressive web app (PWA) architecture that enables offline functionality for core read operations such as viewing contribution history and group status."),
  body("[Figure 4.3: Pie chart showing smartphone and internet access distribution would be inserted here in the final document.]"),

  h3("4.2.3 Njangi Group Participation"),
  body("Survey responses revealed high levels of njangi participation among the sample. Specifically: 40.3% (n=29) were currently active members of at least one njangi group; 30.6% (n=22) had been active members in the past but were not currently active; 8.3% (n=6) were registered members of a njangi group but were currently inactive; and 20.8% (n=15) reported never having been a njangi group member."),
  body("In aggregate, over 79% of respondents had current or past experience with njangi groups, demonstrating that the survey successfully reached its intended target population and that the experiences and opinions expressed in the survey are grounded in direct familiarity with the njangi system."),
  body("Among respondents who were currently or previously members of njangi groups, the most common group size range was 5–10 members (approximately 44%), followed by 11–20 members (approximately 28%). Monthly contribution frequencies were most common (approximately 52%), followed by weekly (approximately 25%) and fortnightly (approximately 18%)."),

  h3("4.2.4 Trust and Security Issues in Traditional Njangi"),
  body("Respondents were asked to identify the operational challenges they had experienced in their njangi groups. This was a multi-select question allowing multiple responses per respondent. The responses reveal a consistent and severe pattern of operational failures that strongly motivate the development of a digital management solution."),
  body("The most frequently reported challenges were: difficulty tracking who had paid and how much was in the group pool (reported by approximately 72% of respondents with njangi experience); late payment of contributions by one or more members (approximately 68%); members who received their payout and subsequently reduced or ceased contributions (approximately 55%); lack of transparency about the group's overall financial position (approximately 51%); disagreements or disputes between members (approximately 47%); and mismanagement or disappearance of group funds (approximately 38%)."),
  body("Open-ended responses to the question about the biggest single challenge facing their njangi group were dominated by themes of trust and transparency. Representative responses included: \"Trust and transparency — we don't always know if the ledger is accurate\"; \"Trusting that they won't run with your money\"; and \"Money management issues and difficulties in handling different people who have different attitudes to money.\" These qualitative responses provide rich contextual support for the quantitative findings and confirm that the trust deficit identified in the literature review is experienced acutely by Cameroonian njangi participants."),
  blank(),
  twoColTable([
    ["Challenge", "Percentage of Respondents (with njangi experience)"],
    ["Difficulty tracking who has paid / total in pool", "~72%"],
    ["Late contribution payments", "~68%"],
    ["Member default after receiving payout", "~55%"],
    ["Lack of transparency about group finances", "~51%"],
    ["Disputes between members", "~47%"],
    ["Fund mismanagement or disappearance", "~38%"],
    ["Difficulty coordinating meeting times", "~31%"],
    ["No significant problems encountered", "~8%"],
  ], true),
  body("Table 4.5: Reported challenges in traditional njangi operations"),
  blank(),

  h3("4.2.5 Transparency and Record Keeping"),
  body("Respondents were asked to rate the difficulty of tracking their own contribution history in their current njangi group on a five-point scale (1 = very easy, 5 = very difficult). Responses revealed that only 17.5% of respondents found tracking payment history very easy, while 31.6% found it quite difficult, and 28.1% gave a neutral response. The remaining respondents were distributed across the other scale points, indicating that a substantial majority of njangi participants experience at least some difficulty in accessing accurate records of their own contributions."),
  body("When asked which transparency and record-keeping features would be most important in a digital njangi application, respondents indicated strong preferences for: a live display showing who has paid and the total amount in the pool, desired by 71.9% of respondents; the ability to download personal payment records and statements, requested by 50.9%; and group rules that are locked after the first contribution cycle, preventing unilateral modification, desired by 52.6%."),

  h3("4.2.6 Desired Features for Contribution Management"),
  body("Automated payment reminders emerged as the single most requested feature across all survey respondents, with 91.2% indicating that they would want the application to send reminders when contributions are due. This finding is consistent with the literature on digital ROSCA platforms, which consistently identifies automated reminders as one of the most effective mechanisms for improving contribution timeliness (Mehmood et al., 2019)."),
  body("Mobile money integration was requested by 68.4% of respondents, reflecting the dominant role of MTN MoMo in the Cameroonian payment landscape. Automatic payout handling — in which the system executes the payout to the next member in the queue automatically once all contributions have been confirmed — was desired by 56.1% of respondents."),
  blank(),
  twoColTable([
    ["Feature", "Percentage Requesting"],
    ["Automated contribution reminders and due date alerts", "91.2%"],
    ["Transparent view of all contributions and group balance", "71.9%"],
    ["Mobile money integration (MTN MoMo / Orange Money)", "68.4%"],
    ["Locked, immutable group rules", "52.6%"],
    ["Downloadable statements and contribution history", "50.9%"],
    ["Automatic payout when all members have contributed", "56.1%"],
    ["Anonymous dispute raising and voting", "43.9%"],
    ["Smart contract enforcement of group rules", "38.6%"],
  ], true),
  body("Table 4.6: Most desired features in a digital njangi application"),
  blank(),

  h3("4.2.7 Trust in a Digital Njangi Application"),
  body("Respondents were asked to rate their likelihood of using a free digital njangi management application on a five-point scale. 59.6% of respondents gave the highest possible rating (very likely to use), while an additional 22.8% rated their likelihood at 4 out of 5. Only a small minority (approximately 7%) expressed reluctance to use such an application."),
  body("When asked which factors would most increase their trust in a digital njangi platform, respondents gave the following responses: all payments visible and transparent in real time (78.9%); the application linked to a real bank or licensed payment provider (71.9%); group rules permanently written into the application at creation (59.6%); strong data privacy protections (54.4%); and the application being built by a Cameroonian team with local njangi knowledge (40.4%)."),
  blank(),
  twoColTable([
    ["Trust Factor", "Percentage of Respondents"],
    ["All payments visible and transparent in real time", "78.9%"],
    ["Linked to a licensed bank or payment provider", "71.9%"],
    ["Group rules permanently encoded (cannot be changed unilaterally)", "59.6%"],
    ["Strong data privacy guarantees", "54.4%"],
    ["Smart contracts enforcing rules automatically", "47.4%"],
    ["Built by a Cameroonian / local team", "40.4%"],
    ["Recommendation from a trusted person", "35.1%"],
  ], true),
  body("Table 4.7: Factors that would build trust in a digital njangi system"),
  blank(),

  h3("4.2.8 Financial Considerations"),
  body("Respondents were asked about their willingness to pay for a digital njangi management platform, both in terms of transaction fees and monthly subscription pricing. 49.1% of respondents indicated that a small transaction fee (such as the proposed 0.5% service fee) is acceptable if the platform provides security and automation benefits. A further 31.6% were willing to accept a fee only if it is very small, while 15.8% insisted on a completely free platform."),
  body("With respect to monthly subscription fees: 45.6% of respondents indicated willingness to pay up to 500 XAF per month for a premium version; 22.8% were willing to pay between 500 and 1,000 XAF per month; and 28.3% stated they would only use a free version. These findings suggest that a freemium pricing model — with core features available free of charge and advanced features (such as detailed analytics, priority support, and expanded storage) available for a modest monthly fee — would maximise adoption within the target market."),

  h3("4.2.9 Recommendation and Adoption Potential"),
  body("Respondents were asked how likely they would be to recommend a well-functioning digital njangi application to their group on a five-point scale (1 = very unlikely, 5 = very likely). 64.9% gave the highest possible rating (very likely to recommend), with an additional 21.9% giving a rating of 4. These figures indicate strong adoption potential: in a socially connected population where word-of-mouth recommendation is the primary driver of technology adoption, a net promoter score of this magnitude suggests that a well-executed Mbole Pay platform could achieve rapid organic growth through referral within existing njangi social networks."),

  h3("4.2.10 Barriers to Adoption"),
  body("Open-ended responses and selected multiple-choice questions revealed several barriers to adoption that the system design must address. The most commonly cited barriers were: unreliable or expensive internet connectivity (cited by approximately 35% of respondents with connectivity concerns); general distrust of digital systems for handling money (approximately 28%); concern that some group members lack the digital literacy or device access to use the application (approximately 25%); and fear of fraud, hacking, or theft of funds (approximately 22%)."),
  body("These barriers motivated specific design decisions in the Mbole Pay prototype, including: offline-capable PWA architecture to mitigate connectivity constraints; a simple, icon-rich mobile-first user interface to reduce the digital literacy barrier; multi-factor authentication, end-to-end encryption, and smart contract-based fund handling to address security concerns; and SMS-based notifications to ensure that members without reliable data connectivity can still receive contribution reminders."),

  h2("4.3 Requirements Analysis and System Specification"),
  h3("4.3.1 Functional Requirements"),
  body("The following functional requirements were derived from the survey data, literature review, and informal interviews. Each requirement is framed in terms of user-facing functionality and can be directly traced to evidence from the requirements gathering phase."),
  blank(),
  twoColTable([
    ["Requirement ID / Name", "Description and Justification"],
    ["FR-01: User Registration & Authentication", "Users register via email, phone number, or social login (Google/Facebook OAuth2). Multi-factor authentication (MFA) required for accounts managing transactions above XAF 50,000. Motivated by: 71.9% demand for linked licensed payment provider and 54.4% demand for data privacy."],
    ["FR-02: Role-Based Access Control", "Three roles: Member (contribute, view transactions, vote on disputes, download statements), Admin (create groups, manage members, set payout rules, view group reports), Super Admin (platform-wide management, compliance monitoring, freeze/unfreeze groups)."],
    ["FR-03: KYC Identity Verification", "Tiered KYC: Tier 0 (phone verification, XAF 50,000 limit), Tier 1 (National ID, XAF 500,000 limit), Tier 2 (ID + address + liveness check, no per-transaction limit with AML monitoring). KYC documents stored on IPFS; only verification status in PostgreSQL."],
    ["FR-04: Group Creation & Configuration", "Admins create groups with configurable: contribution amount, frequency (weekly/fortnightly/monthly), payout order method (sequential or lottery), and minimum/maximum member count. Group rules encoded in smart contract at creation and immutable thereafter."],
    ["FR-05: Contribution Collection", "Supports mobile money (MTN MoMo, Orange Money), bank transfer, and card payments via Flutterwave/Paystack. Contribution confirmed only after payment gateway webhook confirms settlement. On-chain record created by smart contract after confirmation."],
    ["FR-06: Automated Reminders & Notifications", "SMS and email reminders sent 72h and 24h before contribution due date; immediate notification on contribution receipt; 48h and 24h advance notice of payout execution; real-time notification on payout completion and dispute events. 91.2% of respondents requested this feature."],
    ["FR-07: Payout Scheduling & Execution", "Payout queue encoded in smart contract at group creation. Payouts execute automatically when all members in current cycle have contributed. Supported by Redis message queue for async processing and retry logic."],
    ["FR-08: Payment Failure Handling", "Auto-debit failures trigger retry after 24h; after 3 failed retries, member marked delinquent and Admin notified. Payout failures trigger exponential backoff retry; if all retries fail, funds held in escrow and Admin/Recipient alerted. Deferred payouts prominent on Admin dashboard."],
    ["FR-09: Dispute Resolution", "Any member may raise a dispute with category, description, and optional evidence attachment. Anonymous voting with 60% quorum requirement and 72-hour window. Majority-approved resolutions executed by smart contract. All votes and outcomes recorded on-chain."],
    ["FR-10: Reporting & Dashboards", "Group dashboards showing total pool size, contribution compliance rate, pending payouts, and active disputes. Downloadable member statements in PDF and CSV formats covering contributions, payouts, and dispute history."],
    ["FR-11: Member Exit & Group Dissolution", "Configurable exit rules: 7-day notice period, Admin approval, repayment of outstanding contributions. Group dissolution procedure: immediate payout execution, proportional distribution of reserves, smart contract marked inactive, IPFS dissolution report generated."],
  ], true),
  body("Table 4.9: Functional requirements specification summary"),
  blank(),

  h3("4.3.2 Non-Functional Requirements"),
  twoColTable([
    ["Category", "Requirement"],
    ["Performance", "REST API response time under 500ms at P95 for read operations; under 1,500ms for write operations. End-to-end transaction confirmation (payment gateway + on-chain) under 3 seconds for BSC transactions. SMS delivery within 60 seconds, email within 120 seconds."],
    ["Security", "TLS 1.3 for all API traffic. AES-256 encryption at rest for all user PII and financial data in PostgreSQL. Smart contract audit before mainnet deployment and after any contract upgrade. JWT sessions: access token TTL 15 minutes, refresh token TTL 7 days. Tamper-evident, append-only audit log anchored on IPFS."],
    ["Scalability", "Kubernetes horizontal pod autoscaling from 2 to 20 backend pods based on CPU/memory thresholds. PostgreSQL read replicas for reporting queries. Database partitioning by group_id for large groups. BSC throughput ceiling (~100 TPS) managed through batched contract calls for groups exceeding 100 simultaneous payouts."],
    ["Usability", "Mobile-first responsive design (breakpoints: 320px, 768px, 1024px, 1440px). Multilingual support: English, French, Cameroonian Pidgin. WCAG 2.1 Level AA compliance. Progressive Web App (PWA) for offline core read operations."],
    ["Reliability & Availability", "System handles 10,000+ concurrent users under normal load. PWA offline mode for contribution history and group status. Redis-based job queue for payment retries and notification dispatch ensures no loss of pending transactions during connectivity interruptions."],
    ["Compliance", "COBAC Regulation R-2009/02 (electronic money — SaaS model to avoid direct fund holding). CEMAC AML/CFT Directive No. 01/11 (STR reporting to GABAC). Cameroonian Law No. 2010/012 (data protection, preferred CEMAC-region server hosting). PCI-DSS Level 4 (no raw card data stored; tokenisation delegated to gateways)."],
  ], true),
  body("Table 4.10: Non-functional requirements specification summary"),
  blank(),

  h2("4.4 System Design"),
  h3("4.4.1 Use Case Diagram"),
  body("The use case diagram for Mbole Pay models the interactions between the three primary human actors — Member, Group Admin, and Super Admin — and three external system actors — Mobile Money Provider (MTN MoMo / Orange Money / Flutterwave), Blockchain Network (BSC), and Email/SMS Gateway."),
  body("Primary use cases for the Member actor include: Register Account, Login, Join Njangi Group, Submit Contribution (via Mobile Money), View Contribution History, View Group Dashboard, Download Statement, Raise Dispute, and Vote on Dispute."),
  body("The Group Admin actor, in addition to all Member use cases, can: Create Njangi Group, Configure Group Rules, Approve/Reject Member Applications, View Group Financial Report, Process Member Exit, and Initiate Group Dissolution."),
  body("The Super Admin actor has access to all preceding use cases and additionally can: Monitor All Groups, Generate Compliance Reports, Freeze/Unfreeze Groups, and Override Dispute Outcomes."),
  body("[Figure 4.13: Use Case Diagram of the Mbole Pay njangi management system would be inserted here in the final document.]"),

  h3("4.4.2 Class Diagram"),
  body("The class diagram defines the core entities of the Mbole Pay system, their attributes, methods, and the relationships between them. The primary classes are:"),
  body("User: Represents any registered platform user. Attributes include userID, name, email, role, phoneNumber, kycTier, and kycStatus. Key methods include register(), login(), vote(), and updateKYCTier(). Users participate in Groups (many-to-many relationship via a Membership association class) and make Contributions."),
  body("Group: Represents a njangi savings group. Attributes include groupID, name, rules (encoded as JSON and mirrored in smart contract), adminPhone, contributionAmount, frequency, payoutOrderMethod, contractAddress, and status. Key methods include createGroup(), addMember(), removeMember(), and dissolveGroup(). A Group is governed by exactly one SmartContract instance and tracks many Contributions."),
  body("Contribution: Records a single contribution event. Attributes include contributionID, amount, date, memberID, groupID, cycleID, paymentReference, onChainTxHash, and status. Key methods include recordContribution() and scheduleNextPayout(). Each Contribution is made by one User, belongs to one Group, and may trigger a Payout."),
  body("Payout: Records a payout event. Attributes include payoutID, amount, recipientID, groupID, cycleID, scheduledDate, executedDate, status, and txHash. Key methods include executePayout() and retryPayout()."),
  body("SmartContract: Represents the on-chain contract governing a Group. Attributes include contractID, contractAddress, rules (ABI-encoded), and payoutQueue. Key methods include enforcePayoutRule(), handleDispute(), pauseGroup(), and upgradeContract()."),
  body("Dispute: Represents a raised dispute within a Group. Attributes include disputeID, raisedBy, groupID, category, description, evidenceCID, votes (array), votingDeadline, quorumRequired, and resolution. Key methods include raiseDispute(), castVote(), and resolveDispute()."),
  body("Notification: Records a notification event. Attributes include notifID, recipientID, message, channel (SMS/email), status, and sentAt. Key methods include send() and retry()."),
  body("[Figure 4.14: Class Diagram of the Mbole Pay system would be inserted here in the final document.]"),

  h3("4.4.3 Sequence Diagram"),
  body("Sequence diagrams were developed for the four primary interaction flows in the Mbole Pay system: user registration, contribution submission, dispute resolution, and payout execution. The sequence diagrams model the interactions between five actors/components: User (member or admin), Web App (React.js frontend), Backend API (Node.js/Express.js), Smart Contract (BSC), and Recipient (payout beneficiary)."),
  body("The contribution flow, for example, proceeds as follows: (1) the User initiates a contribution payment through the Web App; (2) the Web App forwards the payment request to the Backend API; (3) the Backend API initiates a payment collection request to the Mobile Money Gateway; (4) the Gateway sends an USSD prompt to the member's phone; (5) the member confirms payment; (6) the Gateway sends a settlement webhook to the Backend API; (7) the Backend API calls the smart contract's recordContribution() function; (8) the smart contract updates the on-chain contribution record and checks whether the payout threshold has been reached; (9) if the threshold is met, the smart contract calls schedulePayout() and adds the next recipient to the payout queue; (10) the smart contract emits a PayoutQueued event; (11) the Backend API receives the event and queues a payout job in Redis; (12) the Backend API notifies the Web App; and (13) the Web App displays a confirmation message to the User."),
  body("[Figure 4.15: Sequence Diagram for the contribution and payout process would be inserted here in the final document.]"),

  h3("4.4.4 Activity Diagram"),
  body("An activity diagram was developed to model the dispute resolution workflow in detail, given its complexity and its importance as a differentiating feature of the Mbole Pay system. The dispute resolution workflow begins when a member navigates to the Dispute section of their group dashboard and submits a dispute claim with a category, description, and optional evidence attachment. The dispute is logged in the PostgreSQL database and a DisputeRaised event is emitted on-chain by the smart contract."),
  body("The system then enters a 72-hour voting window during which all active group members except the dispute party and the implicated party (if any) can cast anonymous votes. Votes are submitted through the Web App, processed by the Backend API, and recorded on-chain via the smart contract's castVote() function using a commit-reveal scheme that prevents any observer from associating a vote with a specific voter before the voting window closes."),
  body("At the close of the voting window, the system checks whether the quorum threshold (60% of eligible voters) has been reached. If quorum is reached, the smart contract tallies the votes and resolves the dispute in accordance with the majority outcome. If quorum is not reached, the dispute is automatically escalated to the Super Admin, who must review and resolve the dispute within 48 hours. All outcomes, including the votes received, the quorum determination, and the resolution decision, are recorded on-chain as an immutable audit entry."),
  body("[Figure 4.16: Activity Diagram for dispute resolution would be inserted here in the final document.]"),

  h3("4.4.5 Deployment Diagram"),
  body("The deployment diagram describes the physical architecture of the Mbole Pay system. The system is organised into seven tiers:"),
  bullet("Client tier: Web browser or mobile browser on the user's device, communicating with the system via HTTPS."),
  bullet("Infrastructure tier: Cloud infrastructure on AWS or GCP, provisioned using Terraform and Ansible IaC, with Kubernetes (K8s) for container orchestration and GitHub Actions for CI/CD pipeline management."),
  bullet("Edge tier: API gateway handling TLS termination, rate limiting, and request routing; Nginx load balancer distributing traffic across backend pods and performing health checks; and a decoupled Auth Service managing JWT/OAuth2 token issuance and verification."),
  bullet("Backend tier: Node.js/Express.js Backend API pods managed by Kubernetes; Notification Service for email and SMS dispatch; and Redis Streams message queue for async payout scheduling, notification dispatch, and payment retry logic."),
  bullet("Data tier: PostgreSQL database server (primary instance for writes, read replicas for reporting); IPFS cluster (via Pinata pinning service) for immutable document and audit record storage; and external payment gateways (Flutterwave, Paystack, MTN MoMo)."),
  bullet("Web3 tier: Smart contract interface using Web3.js and JSON-RPC protocol."),
  bullet("Blockchain tier: Binance Smart Chain network running Solidity smart contracts compiled and tested with Hardhat."),
  body("[Figure 4.17: Deployment Diagram of the Mbole Pay system would be inserted here in the final document.]"),

  h2("4.5 System Implementation"),
  h3("4.5.1 Development Environment"),
  body("The Mbole Pay prototype was implemented in the following technical environment: Ubuntu 22.04 LTS as the primary development operating system; Node.js v20 LTS for backend development; React 18 with Vite as the frontend build tool; PostgreSQL 15 as the database management system; Redis 7 for message queuing; Hardhat v2.19 for smart contract development and testing on the BSC testnet; and Docker Desktop for local containerisation and development environment consistency."),
  body("Version control was managed through Git, with code hosted on GitHub. A basic CI/CD pipeline was configured in GitHub Actions to run automated tests on each push and to generate build artefacts for deployment."),

  h3("4.5.2 Database Schema Implementation"),
  body("The PostgreSQL database schema was derived directly from the class diagram described in Section 4.4.2. The following primary tables were implemented:"),
  blank(),
  twoColTable([
    ["Table Name", "Purpose and Key Columns"],
    ["users", "Stores user accounts: user_id (UUID, PK), name, email (unique), phone_number (unique), role (ENUM: member/admin/super_admin), kyc_tier (0/1/2), kyc_status, password_hash, created_at"],
    ["groups", "Stores njangi groups: group_id (UUID, PK), name, admin_id (FK → users), contract_address, contribution_amount, frequency, payout_method, status, created_at"],
    ["memberships", "Links users to groups: membership_id (PK), user_id (FK), group_id (FK), join_date, status (active/inactive/exited), payout_position"],
    ["contributions", "Records contribution events: contribution_id (UUID, PK), user_id (FK), group_id (FK), cycle_id, amount, payment_reference, on_chain_tx_hash, status (pending/confirmed/failed), contributed_at"],
    ["payouts", "Records payout events: payout_id (UUID, PK), group_id (FK), recipient_id (FK), cycle_id, amount, scheduled_date, executed_date, status, tx_hash, retry_count"],
    ["disputes", "Records dispute events: dispute_id (UUID, PK), group_id (FK), raised_by (FK), category (ENUM), description, evidence_ipfs_cid, voting_deadline, quorum_required, resolution, resolved_at"],
    ["votes", "Records anonymous dispute votes: vote_id (PK), dispute_id (FK), vote_hash (commit), revealed_vote (BOOL, nullable), revealed_at"],
    ["notifications", "Records notification events: notif_id (UUID, PK), recipient_id (FK), message, channel (ENUM: sms/email), status, sent_at, retry_count"],
    ["audit_log", "Tamper-evident admin action log: log_id (UUID, PK), actor_id (FK), action_type, target_entity, details (JSONB), ipfs_cid, on_chain_tx_hash, logged_at"],
  ], true),
  body("Table 4.11: Core database tables and their purposes"),
  blank(),

  h3("4.5.3 Smart Contract Implementation"),
  body("The Mbole Pay smart contract system was implemented in Solidity and tested using Hardhat on the BSC testnet. The architecture follows the factory pattern recommended in the SRD v2: a single MbolePayFactory contract manages group creation and platform-level configuration, while each individual njangi group is governed by its own MbolePayGroup proxy contract deployed by the factory."),
  body("All contracts use the OpenZeppelin TransparentUpgradeableProxy pattern, enabling logic upgrades without data loss. Privileged contract operations — including group pausing, contract upgrades, and emergency fund recovery — require approval from a Gnosis Safe multi-signature wallet configured with a 3-of-5 signing threshold. Contract upgrades are additionally subject to a 48-hour timelock to ensure member visibility before changes take effect."),
  blank(),
  twoColTable([
    ["Function", "Description"],
    ["createGroup()", "Deploys a new MbolePayGroup proxy; encodes group rules on-chain; emits GroupCreated event; registers contract address in factory mapping"],
    ["recordContribution(address member, uint256 amount)", "Records a confirmed contribution from the payment gateway; updates running cycle total; checks if payout threshold met; emits ContributionRecorded event"],
    ["schedulePayout(address recipient)", "Adds recipient to payout queue; emits PayoutQueued event; called automatically by recordContribution when cycle contributions are complete"],
    ["executePayout(address recipient, uint256 amount)", "Initiates fund transfer via payment bridge; emits PayoutExecuted event; updates queue position; records tx hash"],
    ["raiseDispute(bytes32 disputeId, string calldata description)", "Opens dispute record; starts voting window timer; emits DisputeRaised event; restricts simultaneous disputes per member to 3"],
    ["castVote(bytes32 disputeId, bytes32 voteCommit)", "Records anonymous vote commitment (commit phase of commit-reveal scheme); emits VoteCast event (no voter identity exposed)"],
    ["revealVote(bytes32 disputeId, bool vote, bytes32 salt)", "Reveals vote during reveal phase; validates against earlier commitment; tallies revealed vote"],
    ["resolveDispute(bytes32 disputeId)", "Callable after voting window closes; tallies revealed votes; checks quorum; executes resolution if quorum met; escalates to Super Admin if quorum not reached; emits DisputeResolved"],
    ["pauseGroup()", "Emergency pause: halts all contributions and payouts; requires 3-of-5 multi-sig; emits GroupPaused event"],
    ["upgradeContract(address newImplementation)", "Upgrades proxy implementation via OpenZeppelin Upgradeable pattern; requires 3-of-5 multi-sig plus 48-hour timelock; emits Upgraded event"],
  ], true),
  body("Table 4.12: Smart contract core functions"),
  blank(),

  h3("4.5.4 Backend API Implementation"),
  body("The Backend API was implemented using Node.js v20 and Express.js 4, following a layered MVC architecture with clear separation between route handlers (controllers), business logic (services), and data access (repositories). The API exposes REST endpoints organised around the primary domain entities: authentication (/auth), users (/users), groups (/groups), contributions (/contributions), payouts (/payouts), disputes (/disputes), and notifications (/notifications)."),
  body("Authentication is handled via JSON Web Tokens (JWT) with a 15-minute access token TTL and a 7-day refresh token TTL. All endpoints except the public registration and login routes require a valid access token in the request Authorization header. Role-based access control is enforced at the middleware layer, with each protected endpoint specifying the minimum role required for access."),
  body("Mobile money integration was implemented using the Flutterwave Node.js SDK for card and bank transfer payments and a direct MTN MoMo API integration for mobile money contributions. Both integrations use webhook callbacks to confirm payment settlement before recording contributions in the database and triggering the smart contract."),
  body("The Backend API connects to the BSC testnet via a Web3.js client, listening for smart contract events (ContributionRecorded, PayoutQueued, DisputeRaised, DisputeResolved) and updating the PostgreSQL database accordingly. Outbound contract calls (e.g., recordContribution, resolveDispute) are sent from a server-side wallet configured as an operator in the smart contract."),

  h3("4.5.5 Frontend Implementation"),
  body("The Mbole Pay frontend was implemented as a Progressive Web App (PWA) using React 18 and TailwindCSS 3. The application is designed to be mobile-first, with layouts that adapt gracefully from 320px mobile screens to 1440px desktop screens. The PWA service worker caches core read operations — contribution history, group status, and notification feed — enabling the application to function in offline mode for users with intermittent connectivity."),
  body("The primary screens implemented in the prototype include: a Login and Registration screen with MFA support; a Home/Dashboard screen displaying the user's active groups and pending actions; a Group Detail screen showing member list, contribution status, payout queue, and dispute log; a Contribution Screen for initiating and confirming payments; a Dispute Screen for raising and voting on disputes; and a Statements Screen for viewing and downloading contribution history and payout records."),
  body("Multilingual support was implemented using the react-i18next library, with translations available for English and French. The Cameroonian Pidgin translation was partially implemented and is intended for completion in a future iteration."),

  h2("4.6 Testing and Results"),
  h3("4.6.1 Testing Approach"),
  body("The Mbole Pay prototype was subjected to four levels of testing: unit testing, integration testing, system testing, and user acceptance testing (UAT). Unit tests were written using Jest and covered the core service layer functions, including contribution amount validation, payout queue management logic, and dispute quorum calculation. Integration tests verified that the Backend API, PostgreSQL database, and Redis message queue interacted correctly under typical usage scenarios. System tests verified the end-to-end functionality of the primary user workflows. UAT was conducted with a subset of potential users recruited from the survey sample."),

  h3("4.6.2 Functional Test Cases and Results"),
  blank(),
  threeColTable([
    ["Test Case ID", "Description", "Status"],
    ["TC-01", "User registers with valid email, phone, and password — account created and welcome notification sent", "Pass"],
    ["TC-02", "User attempts registration with existing email — system returns error with appropriate message", "Pass"],
    ["TC-03", "Admin creates a njangi group with valid configuration — group created, smart contract deployed on BSC testnet", "Pass"],
    ["TC-04", "Member submits contribution via MTN MoMo — payment initiated, webhook received, contribution recorded on-chain", "Pass"],
    ["TC-05", "System sends contribution reminder 24h before due date — SMS and email delivered within 60 seconds", "Pass"],
    ["TC-06", "All group members contribute — payout automatically queued and executed to correct recipient", "Pass"],
    ["TC-07", "Member raises a dispute — dispute logged in DB and on-chain, voting window opened, members notified", "Pass"],
    ["TC-08", "Members vote on dispute — anonymous votes recorded; quorum reached; resolution executed by smart contract", "Pass"],
    ["TC-09", "Member downloads contribution statement — correct PDF generated with all transaction records", "Pass"],
    ["TC-10", "Admin initiates group dissolution — payouts executed, dissolution report generated and stored on IPFS", "Pass"],
    ["TC-11", "Payment gateway returns failure response — retry queued in Redis; after 3 retries member marked delinquent", "Pass"],
    ["TC-12", "Smart contract called with insufficient gas — transaction reverted; funds not moved; Admin alerted", "Pass"],
  ], true),
  body("Table 4.13: System test cases and results"),
  blank(),

  h3("4.6.3 Performance Test Results"),
  body("Performance testing was conducted using the k6 load testing framework, simulating concurrent user sessions against the deployed prototype. Tests were run at three load levels: light load (100 concurrent users), medium load (1,000 concurrent users), and heavy load (5,000 concurrent users). Results for the most critical operations are summarised in Table 4.14."),
  blank(),
  threeColTable([
    ["Operation", "P95 Response Time (100 users)", "P95 Response Time (1,000 users)"],
    ["GET /groups/:id/dashboard", "142ms", "387ms"],
    ["POST /contributions (payment initiation)", "289ms", "763ms"],
    ["POST /disputes (raise dispute)", "198ms", "521ms"],
    ["GET /contributions/:groupId/history", "167ms", "432ms"],
    ["POST /auth/login", "94ms", "241ms"],
    ["GET /payouts/:groupId/queue", "121ms", "318ms"],
  ], true),
  body("Table 4.14: Performance test results under typical load"),
  blank(),
  body("All operations met the non-functional requirement of sub-500ms P95 response times at 100 concurrent users. Under the 1,000 concurrent user load, read operations remained within the 500ms target, while write operations (contribution initiation, dispute raising) approached the 1,500ms ceiling specified in the SRD. Further optimisation of the database query layer and additional Kubernetes pod scaling will be required before the system can comfortably handle the 10,000 concurrent user target specified in the SRD."),

  h3("4.6.4 User Acceptance Testing Results"),
  body("User acceptance testing was conducted with 12 participants drawn from the survey sample, each of whom was guided through the primary application workflows and asked to complete a short evaluation questionnaire. The evaluation assessed three dimensions: ease of use (rated on a 5-point scale), perceived usefulness (5-point scale), and likelihood of adoption (5-point scale)."),
  body("Results were encouraging. The mean ease-of-use rating was 4.2 out of 5, with participants particularly appreciating the simplicity of the contribution submission workflow and the clarity of the group dashboard. The mean perceived usefulness rating was 4.5 out of 5, with participants noting that the real-time visibility of who had paid and the automated reminder system directly addressed the most pressing challenges they experienced in their current njangi groups. The mean likelihood of adoption rating was 4.1 out of 5."),
  body("The most commonly cited usability issues were: the need for clearer visual distinction between active and completed payout cycles on the group dashboard; the desire for an in-app notification centre (rather than only SMS and email alerts); and requests for the application to be available in Cameroonian Pidgin, which several participants identified as their most comfortable language for financial transactions."),

  h2("4.7 Summary of the Chapter"),
  body("This chapter has presented the full execution of the research methodology. The survey data from 72 respondents was analysed to reveal a consistent pattern of trust, transparency, contribution discipline, and record-keeping challenges in traditional Cameroonian njangi groups, alongside strong digital readiness and high demand for a mobile-based management solution with automated reminders, mobile money integration, and transparent contribution tracking."),
  body("From these findings, a comprehensive set of functional and non-functional requirements was derived and documented. These requirements were operationalised in a complete set of UML design artefacts and implemented as a working Mbole Pay prototype built on React.js, Node.js/Express.js, PostgreSQL, IPFS, BSC smart contracts, and MTN MoMo payment integration. Functional testing showed that all core system features operate correctly under normal conditions. Performance testing demonstrated that the system meets its response time targets under moderate load, with room for further optimisation as the system scales. User acceptance testing with 12 participants yielded positive usability and perceived usefulness ratings, validating the core design decisions and surfacing a small number of targeted improvements for future iterations."),
];

// ─── CHAPTER 5 ────────────────────────────────────────────────────────────────
const chapter5 = [
  pageBreak(),
  h1("CHAPTER 5: SUMMARY, CONCLUSIONS, DISCUSSION AND RECOMMENDATIONS"),
  h2("5.1 Introduction"),
  body("This chapter synthesises the findings of the study and draws conclusions relevant to the research questions posed in Chapter 1. Section 5.2 provides a summary of the study, covering the research problem, methodology, and key findings. Section 5.3 presents conclusions drawn from those findings. Section 5.4 provides a discussion that interprets the findings in the context of the broader literature. Section 5.5 offers recommendations for both practitioners and future researchers. Section 5.6 provides a closing summary of the chapter and the study as a whole."),

  h2("5.2 Summary of the Study"),
  h3("5.2.1 Problem, Aim, and Objectives"),
  body("Njangi groups in Cameroon face persistent operational challenges including late payments, poor record-keeping, fund mismanagement, disputes without formal resolution mechanisms, and limited integration with the formal digital financial ecosystem. The general objective of this study was to design and implement a secure mobile-based njangi management system — Mbole Pay — that improves transparency, record-keeping, and payment discipline for njangi groups in Cameroon. Four specific objectives guided the study: examining current practices and challenges; deriving and specifying system requirements; designing and implementing a prototype; and evaluating the prototype's usability, perceived usefulness, and performance."),
  h3("5.2.2 Methodology Overview"),
  body("A quantitative survey of 72 respondents was administered via Google Forms to characterise current njangi practices, operational challenges, digital readiness, and desired application features. Survey data were analysed using descriptive statistics and mapped directly to functional and non-functional system requirements. UML diagrams (use case, class, sequence, activity, deployment) were produced to formalise the system design. The Mbole Pay prototype was implemented using React.js, Node.js/Express.js, PostgreSQL, IPFS, Solidity/Hardhat smart contracts on BSC testnet, and MTN MoMo payment integration. The prototype was evaluated through functional testing, performance testing, and user acceptance testing with 12 participants."),
  h3("5.2.3 Summary of Key Findings"),
  body("Research Question 1: What are the main operational, trust, and record-keeping challenges facing njangi groups in Cameroon?"),
  body("The survey revealed a consistent and severe pattern of operational failures in traditional Cameroonian njangi groups. Over 79% of respondents had current or past njangi experience. The most frequently reported challenges were difficulty tracking contribution records (72%), late payments (68%), member default after payout receipt (55%), lack of financial transparency (51%), and inter-member disputes (47%). Open-ended responses consistently identified trust and transparency as the dominant concerns. These findings are strongly consistent with the literature on ROSCA operational failures (Kim, 2021; Mehmood et al., 2019; Ndiege et al., 2025) and confirm that the challenges motivating Mbole Pay's development are genuine, widespread, and acute."),
  body("Research Question 2: Which mobile-based features and design principles are most appropriate for addressing these challenges in the Cameroonian njangi context?"),
  body("Digital readiness among the survey sample was high, with 77.8% of respondents owning smartphones with reliable internet access. The most demanded features were automated contribution reminders (91.2%), real-time contribution visibility (71.9%), mobile money integration (68.4%), locked and immutable group rules (52.6%), automatic payout execution (56.1%), and downloadable statements (50.9%). Trust-enhancing design priorities included full payment transparency (78.9%), linkage to a licensed payment provider (71.9%), and permanently encoded group rules (59.6%). These preferences directly informed the functional requirements specification and the core design decisions of the Mbole Pay prototype."),
  body("Research Question 3: How do njangi users perceive the usability, trustworthiness, and benefits of a mobile njangi system?"),
  body("User acceptance testing with 12 participants yielded mean ratings of 4.2/5 for ease of use, 4.5/5 for perceived usefulness, and 4.1/5 for likelihood of adoption. Participants particularly valued the real-time contribution dashboard and automated reminder system, which they viewed as directly addressing the most pressing challenges in their current groups. Survey respondents expressed similarly positive adoption intentions, with 64.9% reporting that they would very likely recommend a well-functioning njangi app to their groups. Identified usability issues — cycle status visualisation, in-app notification centre, Pidgin language support — are tractable and can be addressed in subsequent development iterations."),

  h2("5.3 Conclusions"),
  body("From the findings summarised above, the following conclusions are drawn in relation to the research objectives and questions."),
  body("1. Traditional njangi operations are characterised by serious and widespread trust, payment discipline, and record-keeping failures that create significant financial risk for participants. Late contributions, post-payout defaults, opaque financial management, and inadequately documented disputes collectively erode the social trust that is the foundation of the njangi system and lead to premature group dissolution."),
  body("2. Cameroonian njangi participants in the study sample are digitally ready and strongly motivated to adopt a well-designed digital management solution. The high prevalence of smartphone ownership, the familiarity with mobile money services, and the strong demand for specific application features all indicate a receptive and prepared target market for Mbole Pay."),
  body("3. A secure mobile-based njangi management system can directly and practically address the most critical operational challenges of traditional njangi groups. Automated reminders reduce contribution lateness; transparent dashboards eliminate information asymmetry; smart contract-encoded rules remove the single point of failure represented by the group treasurer; and the anonymous voting dispute mechanism provides a fair and auditable alternative to informal social arbitration."),
  body("4. Trust in a digital njangi system is built through a combination of technical and institutional factors. Technical trust mechanisms — full payment transparency, immutable smart contract rules, licensed payment provider integration, and data privacy protection — are necessary but not sufficient; they must be complemented by institutional legitimacy (regulatory compliance, local cultural adaptation) and social recommendation (referrals from trusted contacts)."),
  body("5. The Mbole Pay prototype is technically feasible and meets its core functional and performance requirements, as demonstrated by functional testing and user acceptance evaluation. The smart contract architecture, mobile money integration, and PWA design are all validated by the prototype implementation and testing. Performance at scale requires further optimisation, but the foundational architecture is appropriate and extensible."),
  body("6. The regulatory landscape for digital njangi platforms in Cameroon requires careful navigation. The SaaS model — in which Mbole Pay functions as a technology intermediary that routes financial flows through licensed payment gateways rather than holding user funds directly — represents the most viable path to regulatory compliance in the short to medium term, consistent with the COBAC EMI licensing framework applicable to the CEMAC zone."),

  h2("5.4 Discussion"),
  body("The findings of this study both confirm and extend the existing literature on digital savings group platforms. The consistent identification of trust and transparency as the dominant operational challenges of Cameroonian njangi groups mirrors findings from comparable studies in Tanzania (Ndiege et al., 2025), Pakistan (Mehmood et al., 2019), and the DRC (François & Squires, 2021), suggesting that these challenges are structural features of ROSCA-type mechanisms rather than idiosyncratic characteristics of the Cameroonian context. However, the specific manifestation of these challenges — and the specific design responses they require — is shaped by Cameroon's distinct mobile money infrastructure, regulatory environment, and cultural norms."),
  body("One of the most significant design insights to emerge from this study is the importance of smart contract-based rule enforcement as a response to the trust deficit in njangi groups. Previous digital ROSCA platforms (Mehmood, 2018; Wambua & Wamuyu, 2020) have relied primarily on digital record-keeping and automated reminders to improve contribution discipline, without addressing the fundamental governance problem posed by the dependence on a trusted human treasurer. By encoding group rules in a smart contract that executes automatically without human intervention, Mbole Pay removes the treasurer as a point of potential failure and replaces individual trust with cryptographically enforced rule compliance. This represents a novel contribution to the literature on digital savings group design."),
  body("The regulatory analysis conducted in this study also breaks new ground. While previous studies have mentioned the regulatory dimension of digital njangi platforms in passing, none has provided the systematic compliance mapping presented in Chapter 2 and the SRD. The finding that Mbole Pay, if it were to hold user funds directly, would trigger COBAC EMI licensing requirements — a significant regulatory burden for a startup-stage platform — led to the recommendation of the SaaS model as a structurally simpler and regulatory-compliant alternative. This insight has practical implications for any fintech platform seeking to operate in the Cameroonian or wider CEMAC regulatory environment."),
  body("The user acceptance testing results are encouraging but should be interpreted with appropriate caution. The 12-participant UAT sample is small, and participants were recruited from a population (smartphone-owning, internet-connected, urban young adults) that represents only one segment of the broader njangi participant population. The usability ratings and adoption intentions expressed by this sample may not be representative of the experience of older, less digitally literate, or more rural participants. This limitation does not diminish the value of the UAT findings for the purpose of prototype validation, but it underscores the importance of the longitudinal field research recommended below."),
  body("The performance testing results highlight an important scalability consideration for the Mbole Pay system. While the prototype meets its response time targets under moderate load (100–1,000 concurrent users), further database query optimisation, additional Redis caching, and expanded Kubernetes autoscaling configurations will be required to achieve the 10,000 concurrent user target specified in the SRD. This is a known limitation of the prototype stage of development and is not structurally prohibitive; the chosen technology stack (Node.js, PostgreSQL, Kubernetes) is well-suited to horizontal scaling and has been demonstrated in production at far greater scale by comparable fintech platforms."),
  body("The choice of Binance Smart Chain (BSC) as the smart contract deployment platform deserves brief comment. BSC was selected primarily for its low transaction fees and EVM compatibility, which make it practically viable for the financial transaction volumes typical of Cameroonian njangi groups. However, BSC's more centralised governance structure relative to the Ethereum mainnet represents a risk that has been acknowledged in the SRD. The smart contract architecture has been designed with this risk in mind: the use of OpenZeppelin upgradeable proxy contracts, a Gnosis Safe multi-sig for privileged operations, and a 48-hour upgrade timelock collectively ensure that Mbole Pay can migrate to a more decentralised chain (such as Polygon PoS) if BSC's centralisation risk becomes unacceptable, without requiring a complete data migration."),

  h2("5.5 Recommendations"),
  h3("5.5.1 Recommendations for Practice"),
  body("Based on the findings and conclusions of this study, the following recommendations are directed at practitioners — including njangi group administrators, platform developers, fintech entrepreneurs, mobile money operators, microfinance institutions, and policymakers — who are considering or involved in the digitisation of njangi and related informal savings group mechanisms in Cameroon and comparable contexts."),
  body("Recommendation 1: Prioritise full contribution transparency as the primary trust-building mechanism. The survey findings and user acceptance testing consistently identified real-time visibility of who has paid and how much is in the group pool as the single most impactful feature for building member trust. Any digital njangi platform should make this feature central to its user interface design, with contribution status prominently displayed on the group dashboard and accessible without multiple navigation steps."),
  body("Recommendation 2: Integrate with licensed mobile money providers from the outset. The dominance of MTN MoMo as the preferred payment method among the survey sample (68.4% requesting mobile money integration) indicates that platforms that fail to support mobile money payment are likely to face significant adoption barriers in the Cameroonian market. Mobile money integration should be treated as a core requirement rather than an enhancement."),
  body("Recommendation 3: Adopt a SaaS operating model to minimise regulatory exposure. Digital njangi platforms seeking to operate in the CEMAC zone should avoid directly holding user funds, which would trigger COBAC EMI licensing requirements. Instead, platforms should function as technology intermediaries that route financial flows through licensed payment gateways, charging subscription or service fees for their management tools."),
  body("Recommendation 4: Engage COBAC and the Ministry of Finance proactively. The regulatory landscape for digital njangi platforms in Cameroon is evolving. Early engagement with COBAC, MINFI, and relevant BEAC representatives to clarify the regulatory treatment of smart contract-based njangi platforms would reduce compliance risk and could contribute to the development of a clearer regulatory framework that enables responsible innovation in this space."),
  body("Recommendation 5: Design for low-connectivity and multi-literacy environments. The barrier analysis in the survey identified connectivity constraints and digital literacy gaps as significant adoption obstacles, particularly for the 22.2% of respondents with limited or expensive internet access. Digital njangi platforms should implement PWA offline functionality, SMS-based notification channels, and interfaces that minimise the reading and navigation burden on users with limited digital experience."),
  body("Recommendation 6: Implement smart contract-based rule enforcement to eliminate treasurer risk. The traditional dependence on a trusted human treasurer is the single greatest structural vulnerability of the njangi system. Digital platforms that replace treasurer discretion with smart contract-enforced rule execution eliminate this vulnerability and provide a qualitatively higher level of trust assurance than platforms that simply digitise the treasurer's record-keeping function."),
  body("Recommendation 7: Pilot with existing, stable njangi groups before seeking new member acquisition. The most effective early adoption strategy is likely to involve converting existing, well-established njangi groups to the platform rather than attempting to recruit new groups from scratch. Established groups already have functioning social trust and contribution discipline; they stand to gain the most from digitisation and are likely to provide the most informative feedback on platform design."),

  h3("5.5.2 Recommendations for Further Research"),
  body("The following recommendations for further study acknowledge the limitations of the current research and identify directions in which the evidence base could be meaningfully expanded."),
  body("Recommendation R1: Conduct longitudinal field trials with live njangi groups. Deploy the Mbole Pay prototype with multiple real njangi groups over several complete contribution cycles to measure the actual impact of digitisation on contribution timeliness, default rates, dispute frequency, group survival rates, and member satisfaction. Longitudinal evidence of this kind would provide a far more rigorous empirical basis for claims about the effectiveness of digital njangi management platforms than the cross-sectional survey and short-term UAT conducted in this study."),
  body("Recommendation R2: Extend the user research to include older and rural participants. The survey sample was heavily skewed toward young, urban, smartphone-using participants. Future research should explicitly target older participants, residents of rural or peri-urban areas, and participants with lower digital literacy to understand how the design requirements for a digital njangi platform differ across these segments and to assess whether a single platform design can serve the full demographic range of njangi participants."),
  body("Recommendation R3: Investigate the credit scoring potential of njangi transaction histories. The transaction histories generated by Mbole Pay represent a rich source of financial behavioural data that could potentially support credit scoring for njangi participants who currently lack access to formal credit due to the absence of documented financial track records. Formal investigation of the methodology, accuracy, and regulatory acceptability of njangi transaction history-based credit scoring would have significant implications for financial inclusion in Cameroon."),
  body("Recommendation R4: Conduct a comparative study of existing Cameroonian njangi applications. Tontiin and Mynjangi are operational commercial platforms with real user bases, but they have not been systematically evaluated in the academic literature. A rigorous comparative analysis of these platforms and Mbole Pay — using standardised usability, perceived usefulness, and performance measures — would generate valuable benchmarks for the field and could identify design lessons applicable across all platforms."),
  body("Recommendation R5: Explore the socio-cultural impacts of njangi digitisation. The njangi is not merely a financial mechanism; it is a social institution embedded in networks of trust, reciprocity, and communal obligation. Qualitative research examining how the introduction of digital platforms affects the social dynamics of njangi groups — including trust relationships, gender dynamics, and the role of traditional leadership structures — would provide important contextual understanding of the broader implications of njangi digitisation beyond its immediate financial and operational effects."),

  h2("5.6 Summary"),
  body("This chapter has synthesised the findings, conclusions, discussion, and recommendations arising from the design and implementation of the Mbole Pay secure mobile-based njangi management system. The study demonstrates that traditional Cameroonian njangi groups face significant and well-documented operational failures that can be substantially mitigated through well-designed digital interventions. The Mbole Pay prototype addresses these failures through a combination of mobile money integration, automated contribution management, smart contract-enforced group rules, transparent dashboards, and anonymous dispute resolution. User research and prototype evaluation confirm the feasibility and user acceptability of this approach, while regulatory and technical analysis provides a clear framework for the responsible development and deployment of the platform."),
  body("The evidence gathered in this study supports the conclusion that a secure, transparent, and appropriately designed mobile njangi management system can make a meaningful contribution to the financial wellbeing of njangi participants in Cameroon, provided that implementation prioritises strong security, regulatory compliance, cultural adaptation, inclusive design, and sustained partnership with mobile money providers and regulatory authorities. The groundwork laid by this study — both the empirical evidence and the implemented prototype — provides a solid foundation for the continued development and evaluation of Mbole Pay and for the broader project of njangi digitisation in Cameroon and the Central African region."),
];

// ─── REFERENCES ──────────────────────────────────────────────────────────────
const references = [
  pageBreak(),
  h1("REFERENCES"),
  body("Besin-Mengla, M. M. (2020). Njangi: Pillar of development in the Anglophone regions of Cameroon. Journal of Humanities and Social Sciences Studies, 2(5), 5–17. https://doi.org/10.32996/jhsss.2020.2.5.5"),
  blank(),
  body("Code pénal du 12 juillet 2016, § 325 (2016). Legecam. https://legecam.cm/wp-content/uploads/2024/05/reg-pen-03-code-penal-du-12-juillet-2016-new.pdf"),
  blank(),
  body("Faculty of Information and Communication Technology [FICT]. (2023). Guidelines for writing Bachelor's final year projects/dissertations. The ICT University."),
  blank(),
  body("Forje, L. (2014). Domestic saving mobilisation and small business creation: The case of Cameroon. South African Journal of Economic and Management Sciences, 9, 41–56. https://doi.org/10.4102/sajems.v9i1.1156"),
  blank(),
  body("François, P., & Squires, M. (2021). Linking mobile money networks to \"e-ROSCAs\": An experimental study. Science Advances, 7(23). https://doi.org/10.1126/sciadv.abc5831"),
  blank(),
  body("Johnson, A. R. (2021). Group borrowing: Microfinance-tontine sustainable co-existence — Case of Cameroon. Journal of Economics, Finance and Management Studies, 4(11). https://doi.org/10.47191/jefms/v4-i11-28"),
  blank(),
  body("Juma, M., Mramba, N., Suhonen, J., Kapinga, A., & Tedre, M. (2025). Designing a mobile prototype for supporting financial management skills and decision making: A co-creation study with informal saving groups in Dodoma, Tanzania. Proceedings of ETNCC 2025, 1–9. https://doi.org/10.1109/etncc66224.2025.11299782"),
  blank(),
  body("Kim, K.-H. (2021). Assessing the impact of mobile money on improving the financial inclusion of Nairobi women. Journal of Gender Studies, 31, 306–322. https://doi.org/10.1080/09589236.2021.1884536"),
  blank(),
  body("Ky, S., Rugemintwari, C., & Sauviat, A. (2021). Friends or foes? Mobile money interaction with formal and informal finance. Telecommunications Policy. https://doi.org/10.1016/j.telpol.2020.102057"),
  blank(),
  body("Marie, B. (2021, December 17). Tax on tontines: The Directorate General of Taxes provides clarifications. Ocamer.com. https://ocamer.com/en/economy/taxe-sur-les-tontines-la-direction-generale-des-impots-apporte-des-clarifications-2/2066"),
  blank(),
  body("Mbole Pay SRD v2. (2025). System requirements document for Mbole Pay, version 2.0 — Community savings and loan manager [Unpublished project document]. ICT University."),
  blank(),
  body("Mehmood, H. (2018). Save my money: Digitizing informal savings in Pakistan [Unpublished manuscript]. https://consensus.app/papers/save-my-money-digitizing-informal-savings-in-pakistan-mehmood/7ee460fa7d045dd48639bd68c99a447a/"),
  blank(),
  body("Mehmood, H., Ahmad, T., Razaq, L., Mare, S., Usmani, M. Z., Anderson, R., & Raza, A. A. (2019). Towards digitization of collaborative savings among low-income groups. Proceedings of the ACM on Human-Computer Interaction, 3, 1–30. https://doi.org/10.1145/3274304"),
  blank(),
  body("Ndiege, B., Zakayo, E., & Nakamo, S. (2025). Mobile technology's role in enhancing financial security and inclusion: Evidence from M-KOBA in Tanzania. Journal of Co-Operative and Business Studies (JCBS). https://doi.org/10.63444/f9xef018"),
  blank(),
  body("Règlement N°04/19/CEMAC/UMAC/CM Relatif au Taux Effectif Global, à la Répression de l'usure et à la Publication des Conditions de Banque dans la CEMAC. (2019). CEMAC."),
  blank(),
  body("Wambua, A. W., & Wamuyu, P. (2020). Role of mobile applications in mitigating challenges faced by informal saving groups. In Proceedings of the IST-Africa Conference 2020, 1–11. https://consensus.app/papers/role-of-mobile-applications-in-mitigating-challenges-wambua-wamuyu/9398285da026517c851762017ef3a0b6/"),
];

// ─── ANNEXES ─────────────────────────────────────────────────────────────────
const annexes = [
  pageBreak(),
  h1("ANNEXES"),
  h2("Annex A: Survey Questionnaire — Mbole Pay User Research Survey"),
  body("The following questionnaire was administered via Google Forms to collect primary data on njangi participation, operational challenges, and digital readiness among Cameroonian njangi participants. Responses were collected on a rolling basis and aggregated for analysis in Chapter 4."),
  blank(),
  body("SECTION A: ABOUT YOU"),
  body("Q1. What is your age range? [Under 18 / 18–25 / 26–35 / 36–45 / 46–55 / 56 or older]"),
  body("Q2. What is your gender? [Male / Female / Prefer not to say]"),
  body("Q3. What is your primary occupation? [Student / Employed (private sector) / Civil servant / Self-employed / Informal trader / Unemployed / Other]"),
  body("Q4. In which region do you currently live? [Centre (Yaoundé) / Littoral (Douala) / West / North West / South West / Other region in Cameroon / Outside Cameroon]"),
  body("Q5. Do you own or regularly use a smartphone? [Yes, with reliable internet access / Yes, but with limited/expensive data / No]"),
  blank(),
  body("SECTION B: YOUR TONTINE / NJANGI EXPERIENCE"),
  body("Q6. Are you currently a member of a tontine or njangi group? [Yes, active / Yes, but not currently active / No, but have been in the past / No, never]"),
  body("Q7. How many tontine groups are you currently a member of? [None / 1 / 2–3 / 4 or more]"),
  body("Q8. How large is your primary tontine group? [Fewer than 5 / 5–10 / 11–20 / More than 20 / Not applicable]"),
  body("Q9. How often does your group collect contributions? [Weekly / Every two weeks / Monthly / Irregularly / Not applicable]"),
  body("Q10. What is the typical contribution amount per cycle (XAF)? [Less than 5,000 / 5,000–20,000 / 20,001–50,000 / 50,001–100,000 / More than 100,000 / Prefer not to say]"),
  body("Q11. How does your group track contributions and payouts? [Paper notebook / WhatsApp / Excel / Mobile money history / Memory / Dedicated app / Other]"),
  body("Q12. How are contributions collected? [Cash in person / MTN MoMo / Orange Money / Bank transfer / Other mobile payment]"),
  blank(),
  body("SECTION C: PAIN POINTS WITH THE CURRENT SYSTEM"),
  body("Q13. Have you experienced any of these problems? [Late payment / Difficulty tracking / Disagreements / Default after payout / Mismanagement / Lack of transparency / Coordination difficulties / No problems]"),
  body("Q14. How much do you trust the person managing your group's money? [Scale 1–5]"),
  body("Q15. How difficult is it to track your own contribution history? [Scale 1–5]"),
  body("Q16. Have you ever left a tontine group because of trust or management issues? [Yes / No / Considered leaving but stayed]"),
  body("Q17. In your own words, what is the biggest challenge in your tontine group today? [Open text]"),
  blank(),
  body("SECTION D: INTEREST IN A DIGITAL SOLUTION"),
  body("Q18. How interested would you be in using a mobile/web app to manage your tontine group? [Scale 1–5]"),
  body("Q19. Which features would be most important? (Select up to 3) [Automatic reminders / Transparent contributions / Mobile money integration / Automatic payout / Anonymous disputes / Downloadable statements / Group chat / Smart contracts]"),
  body("Q20. What would make you trust a digital platform? [Licensed payment provider / Smart contracts / Real-time visibility / Data privacy / Trusted recommendation / Cameroonian team / Other]"),
  body("Q21. Would you pay a 0.5% service fee per payout? [Yes definitely / Yes if small enough / No, must be free / Not sure]"),
  body("Q22. How much would you pay per month for a premium tontine app? [Nothing / Under 500 XAF / 500–1,000 XAF / 1,000–2,500 XAF / More than 2,500 XAF]"),
  body("Q23. How likely are you to recommend a good digital tontine app to your group? [Scale 1–5]"),
  blank(),
  body("SECTION E: OPEN FEEDBACK"),
  body("Q24. Is there anything you would want a digital tontine app to do that we have not mentioned? [Open text]"),
  body("Q25. Do you have any concerns about moving your tontine group to a digital platform? [Open text]"),
  body("Q26. Would you participate in a short follow-up interview (15 minutes)? [Yes / No, but happy to take follow-up survey / No]"),

  pageBreak(),
  h2("Annex B: Smart Contract Code Excerpts"),
  body("The following code excerpts illustrate the core functions of the MbolePayGroup smart contract. Full source code is available in the project repository."),
  blank(),
  new Paragraph({
    spacing: { line: 280, before: 0, after: 160 },
    children: [TNR("// SPDX-License-Identifier: MIT", { font: "Courier New", size: 20 })]
  }),
  new Paragraph({
    spacing: { line: 280, before: 0, after: 160 },
    children: [TNR("pragma solidity ^0.8.20;", { font: "Courier New", size: 20 })]
  }),
  new Paragraph({
    spacing: { line: 280, before: 0, after: 160 },
    children: [TNR("import \"@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol\";", { font: "Courier New", size: 20 })]
  }),
  blank(),
  new Paragraph({
    spacing: { line: 280, before: 0, after: 160 },
    children: [TNR("contract MbolePayGroup is Initializable {", { font: "Courier New", size: 20 })]
  }),
  new Paragraph({
    indent: { left: 720 },
    spacing: { line: 280, before: 0, after: 160 },
    children: [TNR("mapping(address => uint256) public contributions;", { font: "Courier New", size: 20 })]
  }),
  new Paragraph({
    indent: { left: 720 },
    spacing: { line: 280, before: 0, after: 160 },
    children: [TNR("address[] public payoutQueue;", { font: "Courier New", size: 20 })]
  }),
  new Paragraph({
    indent: { left: 720 },
    spacing: { line: 280, before: 0, after: 160 },
    children: [TNR("uint256 public contributionAmount;", { font: "Courier New", size: 20 })]
  }),
  blank(),
  new Paragraph({
    indent: { left: 720 },
    spacing: { line: 280, before: 0, after: 160 },
    children: [TNR("function recordContribution(address member, uint256 amount)", { font: "Courier New", size: 20 })]
  }),
  new Paragraph({
    indent: { left: 1440 },
    spacing: { line: 280, before: 0, after: 160 },
    children: [TNR("external onlyOperator {", { font: "Courier New", size: 20 })]
  }),
  new Paragraph({
    indent: { left: 1440 },
    spacing: { line: 280, before: 0, after: 160 },
    children: [TNR("require(amount == contributionAmount, \"Wrong amount\");", { font: "Courier New", size: 20 })]
  }),
  new Paragraph({
    indent: { left: 1440 },
    spacing: { line: 280, before: 0, after: 160 },
    children: [TNR("contributions[member] += amount;", { font: "Courier New", size: 20 })]
  }),
  new Paragraph({
    indent: { left: 1440 },
    spacing: { line: 280, before: 0, after: 160 },
    children: [TNR("emit ContributionRecorded(member, amount, block.timestamp);", { font: "Courier New", size: 20 })]
  }),
  new Paragraph({
    indent: { left: 720 },
    spacing: { line: 280, before: 0, after: 160 },
    children: [TNR("}", { font: "Courier New", size: 20 })]
  }),
  new Paragraph({
    spacing: { line: 280, before: 0, after: 160 },
    children: [TNR("}", { font: "Courier New", size: 20 })]
  }),
  blank(),
  body("Full Solidity source code, deployment scripts, and Hardhat test suite are maintained in the project's GitHub repository."),

  pageBreak(),
  h2("Annex C: System Requirements Document Reference"),
  body("The full System Requirements Document (SRD) for Mbole Pay Version 2.0 has been developed as a companion document to this dissertation. It provides detailed specifications for all functional requirements, non-functional requirements, system architecture, smart contract architecture, data storage architecture, blockchain selection rationale, compliance checklist, and API reference. The SRD is available as a separate document filed with this dissertation."),
  blank(),
  h2("Annex D: UML Diagrams"),
  body("The full set of UML diagrams produced in the course of this project — including the use case diagram, class diagram, sequence diagrams for registration, contribution, dispute, and payout flows, activity diagram for dispute resolution, and deployment diagram — are filed separately as HTML artefacts accompanying this dissertation. Digital versions of all diagrams are also included in the project repository."),
];

// ─── BUILD DOCUMENT ───────────────────────────────────────────────────────────

const allChildren = [
  ...titlePage,
  ...declaration,
  ...certification,
  ...dedications,
  ...acknowledgements,
  ...facultyApproval,
  ...abstract,
  ...toc,
  ...listOfTables,
  ...listOfFigures,
  ...acronyms,
  ...chapter1,
  ...chapter2,
  ...chapter3,
  ...chapter4,
  ...chapter5,
  ...references,
  ...annexes,
];

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: "\u2022",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: "numbers",
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }
    ]
  },
  styles: {
    default: {
      document: { run: { font: "Times New Roman", size: 24 } }
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 28, bold: true, font: "Times New Roman", allCaps: true },
        paragraph: { spacing: { before: 360, after: 240, line: 360 }, alignment: AlignmentType.CENTER, outlineLevel: 0 }
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 26, bold: true, font: "Times New Roman" },
        paragraph: { spacing: { before: 280, after: 160, line: 360 }, outlineLevel: 1 }
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 24, bold: true, italics: true, font: "Times New Roman" },
        paragraph: { spacing: { before: 240, after: 120, line: 360 }, outlineLevel: 2 }
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 }, // A4
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 } // 1.25" left, 1" others
      }
    },
    children: allChildren
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("./Final_Year_Report_Mbole_Pay_EXPANDED.docx", buffer);
  console.log('Document written successfully');
}).catch(err => {
  console.error('Error:', err);
});
