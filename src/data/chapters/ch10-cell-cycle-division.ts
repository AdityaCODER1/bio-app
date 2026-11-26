import type { ChapterData, ChapterDiagram, VaultItem } from '../../types/study';
import { ChapterLineBuilder } from './helpers';

const b = new ChapterLineBuilder('ch10');

const diagrams: ChapterDiagram[] = [
  {
    id: 'ch10-fig-10-1',
    figureNumber: 'Figure 10.1',
    caption: 'A diagrammatic view of cell cycle indicating formation of two cells from one cell',
    imagePath: '/diagrams/ch10/fig-10-1.png',
    pdfPage: 2,
    ncertPage: 121,
    sectionId: 'ch10-10-1-1',
    infoList: [
      {
        category: 'label',
        title: 'G₁, S, G₂ (Interphase — >95% of cycle)',
        detail: 'Yellow sectors occupying over 95% of the circle; ordered clockwise: G₁ (Gap 1) → S (Synthesis / DNA replication) → G₂ (Gap 2).',
      },
      {
        category: 'label',
        title: 'G₀ (Quiescent stage exit loop)',
        detail: 'Circular exit loop branching directly off G₁; cells exiting G₁ enter G₀ (metabolically active, do not proliferate unless called upon, e.g., adult heart cells).',
      },
      {
        category: 'label',
        title: 'M Phase (Prophase → Metaphase → Anaphase → Telophase → Cytokinesis)',
        detail: 'Compact dark-violet/coral wedge lasting only ~1 hour out of a 24-hour human cell cycle.',
      },
      {
        category: 'inference',
        title: 'Clock Direction & Sequence Trap',
        detail: 'Reading clockwise from the top red arrow: Cytokinesis completes two daughter cells → G₁ (optional G₀ exit) → S → G₂ → Prophase → Metaphase → Anaphase → Telophase → Cytokinesis.',
      },
    ],
  },
  {
    id: 'ch10-fig-10-2ab',
    figureNumber: 'Figure 10.2 (a & b)',
    caption: 'A diagrammatic view of stages in mitosis — (a) Early & Late Prophase, (b) Transition to Metaphase & Metaphase',
    imagePath: '/diagrams/ch10/fig-10-2ab.png',
    pdfPage: 4,
    ncertPage: 123,
    sectionId: 'ch10-10-2',
    infoList: [
      {
        category: 'label',
        title: 'Early Prophase',
        detail: 'Intact nuclear envelope; chromosomal material starts condensing into untangled thread-like chromatin.',
      },
      {
        category: 'label',
        title: 'Late Prophase (a)',
        detail: 'Compact chromosomes composed of two chromatids attached at centromere; centrosomes move to opposite poles; nuclear envelope disintegrating (Golgi, ER, nucleolus, nuclear envelope disappear by end of prophase).',
      },
      {
        category: 'label',
        title: 'Transition to Metaphase',
        detail: 'Nuclear envelope completely disintegrated; chromosomes spread in cytoplasm as spindle fibres begin attaching to kinetochores.',
      },
      {
        category: 'label',
        title: 'Metaphase (b)',
        detail: 'All chromosomes (4 chromosomes shown = 2n) aligned along the equatorial metaphase plate; each sister chromatid attached via its kinetochore to opposite poles.',
      },
      {
        category: 'inference',
        title: 'NEET Visual Identification Cue',
        detail: 'Notice the diagram uses 2n = 4 chromosomes (two red, two blue) — in Transition to Metaphase they are scattered with spindle fibres attaching, whereas in Metaphase they form a neat single equatorial line.',
      },
    ],
  },
  {
    id: 'ch10-fig-10-2ce',
    figureNumber: 'Figure 10.2 (c to e)',
    caption: 'A diagrammatic view of stages in Mitosis — (c) Anaphase, (d) Telophase, (e) Interphase',
    imagePath: '/diagrams/ch10/fig-10-2ce.png',
    pdfPage: 5,
    ncertPage: 124,
    sectionId: 'ch10-10-2',
    infoList: [
      {
        category: 'label',
        title: 'Anaphase (c)',
        detail: 'Centromeres split simultaneously; daughter chromatids (now daughter chromosomes) migrate to opposite poles with centromeres at the leading edge and arms trailing behind.',
      },
      {
        category: 'label',
        title: 'Telophase (d)',
        detail: 'Chromosomes cluster at opposite poles, decondense and lose discrete identity; nuclear envelope reforms around both poles while a cleavage furrow begins in the animal cell.',
      },
      {
        category: 'label',
        title: 'Interphase (e)',
        detail: 'Cytokinesis completed via deepening plasma membrane furrow producing two identical diploid daughter cells with restored nuclei and chromatin.',
      },
      {
        category: 'inference',
        title: 'Mitosis Anaphase vs. Meiosis Anaphase I Visual Difference',
        detail: 'In Fig 10.2(c) Mitotic Anaphase, SINGLE-chromatid daughter chromosomes move to each pole (4 chromatids going up, 4 going down). In Fig 10.3 Anaphase I, intact TWO-chromatid homologous chromosomes separate without centromere splitting!',
      },
    ],
  },
  {
    id: 'ch10-fig-10-3',
    figureNumber: 'Figure 10.3',
    caption: 'Stages of Meiosis I',
    imagePath: '/diagrams/ch10/fig-10-3.png',
    pdfPage: 8,
    ncertPage: 127,
    sectionId: 'ch10-10-4-1',
    infoList: [
      {
        category: 'label',
        title: 'Prophase I',
        detail: 'Shows paired homologous chromosomes (bivalents/tetrads) with visible chiasmata / crossing-over segments exchanged between non-sister chromatids (red-blue swapped tips!).',
      },
      {
        category: 'label',
        title: 'Metaphase I',
        detail: 'Bivalent homologous pairs align in TWO rows on the equatorial plate; microtubules from opposite poles attach to kinetochores of homologous chromosomes.',
      },
      {
        category: 'label',
        title: 'Anaphase I',
        detail: 'Homologous chromosomes separate to opposite poles while sister chromatids REMAIN ASSOCIATED at their centromeres (no centromere splitting).',
      },
      {
        category: 'label',
        title: 'Telophase I (Dyad of cells)',
        detail: 'Nuclear membrane and nucleolus reappear; cytokinesis forms a dyad of two haploid cells (each chromosome still has 2 recombined chromatids).',
      },
      {
        category: 'inference',
        title: 'Color-Swapped Arms Reveal Crossing Over',
        detail: 'Inspect Telophase I carefully: each daughter cell contains 2 chromosomes (n = 2 from 2n = 4), and one chromatid of each carries an exchanged segment from Pachytene crossing over.',
      },
    ],
  },
  {
    id: 'ch10-fig-10-4',
    figureNumber: 'Figure 10.4',
    caption: 'Stages of Meiosis II',
    imagePath: '/diagrams/ch10/fig-10-4.png',
    pdfPage: 9,
    ncertPage: 128,
    sectionId: 'ch10-10-4-2',
    infoList: [
      {
        category: 'label',
        title: 'Prophase II',
        detail: 'Initiated immediately after cytokinesis (interkinesis — NO DNA replication); two dyad cells condense chromosomes again as nuclear envelope disappears.',
      },
      {
        category: 'label',
        title: 'Metaphase II',
        detail: 'Chromosomes align singly at the equator in both cells; microtubules from opposite poles attach to kinetochores of SISTER chromatids.',
      },
      {
        category: 'label',
        title: 'Anaphase II',
        detail: 'Simultaneous splitting of centromeres allows sister chromatids to separate and move toward opposite poles via shortening of kinetochore microtubules.',
      },
      {
        category: 'label',
        title: 'Telophase II (Tetrad of cells)',
        detail: 'Nuclear envelopes reform and cytokinesis yields a tetrad of FOUR genetically non-identical haploid daughter cells.',
      },
      {
        category: 'inference',
        title: 'Notice All 4 Haploid Cells Differ!',
        detail: 'Look closely at the 4 Telophase II cells: because of crossing over in Prophase I, the recombinant chromatids produce genetically varied gametes — driving evolution.',
      },
    ],
  },
];

const sections = [
  {
    id: 'ch10-intro',
    number: '10.0',
    title: 'Chapter Opening',
    level: 1 as const,
    blocks: [
      b.paragraph('intro-p1', [
        { text: 'Are you aware that all organisms, even the largest, start their life from a single cell?', pdfPage: 1, ncertPage: 120, clozeTerms: ['single cell'] },
        { text: 'You may wonder how a single cell then goes on to form such large organisms.', pdfPage: 1, ncertPage: 120 },
        { text: 'Growth and reproduction are characteristics of cells, indeed of all living organisms.', pdfPage: 1, ncertPage: 120, clozeTerms: ['Growth and reproduction'], isHighYield: true },
        { text: 'All cells reproduce by dividing into two, with each parental cell giving rise to two daughter cells each time they divide.', pdfPage: 1, ncertPage: 120 },
        { text: 'These newly formed daughter cells can themselves grow and divide, giving rise to a new cell population that is formed by the growth and division of a single parental cell and its progeny.', pdfPage: 1, ncertPage: 120 },
        { text: 'In other words, such cycles of growth and division allow a single cell to form a structure consisting of millions of cells.', pdfPage: 1, ncertPage: 120 },
      ]),
    ],
  },
  {
    id: 'ch10-10-1',
    number: '10.1',
    title: 'Cell Cycle',
    level: 1 as const,
    blocks: [
      b.paragraph('10-1-p1', [
        { text: 'Cell division is a very important process in all living organisms.', pdfPage: 1, ncertPage: 120 },
        { text: 'During the division of a cell, DNA replication and cell growth also take place.', pdfPage: 1, ncertPage: 120, clozeTerms: ['DNA replication', 'cell growth'] },
        { text: 'All these processes, i.e., cell division, DNA replication, and cell growth, hence, have to take place in a coordinated way to ensure correct division and formation of progeny cells containing intact genomes.', pdfPage: 1, ncertPage: 120, clozeTerms: ['coordinated way', 'intact genomes'] },
        { text: 'The sequence of events by which a cell duplicates its genome, synthesises the other constituents of the cell and eventually divides into two daughter cells is termed cell cycle.', pdfPage: 1, ncertPage: 120, clozeTerms: ['duplicates its genome', 'synthesises the other constituents', 'cell cycle'], isHighYield: true },
        { text: 'Although cell growth (in terms of cytoplasmic increase) is a continuous process, DNA synthesis occurs only during one specific stage in the cell cycle.', pdfPage: 1, ncertPage: 120, clozeTerms: ['continuous process', 'one specific stage'], isHighYield: true },
        { text: 'The replicated chromosomes (DNA) are then distributed to daughter nuclei by a complex series of events during cell division.', pdfPage: 1, ncertPage: 120 },
        { text: 'These events are themselves under genetic control.', pdfPage: 1, ncertPage: 120, clozeTerms: ['genetic control'], isHighYield: true },
      ]),
    ],
  },
  {
    id: 'ch10-10-1-1',
    number: '10.1.1',
    title: 'Phases of Cell Cycle',
    level: 2 as const,
    blocks: [
      b.paragraph('10-1-1-p1', [
        { text: 'A typical eukaryotic cell cycle is illustrated by human cells in culture.', pdfPage: 2, ncertPage: 121, clozeTerms: ['human cells in culture'] },
        { text: 'These cells divide once in approximately every 24 hours (Figure 10.1).', pdfPage: 2, ncertPage: 121, clozeTerms: ['24 hours'], isHighYield: true },
        { text: 'However, this duration of cell cycle can vary from organism to organism and also from cell type to cell type.', pdfPage: 2, ncertPage: 121 },
        { text: 'Yeast for example, can progress through the cell cycle in only about 90 minutes.', pdfPage: 2, ncertPage: 121, clozeTerms: ['Yeast', '90 minutes'], isHighYield: true },
        { text: 'The cell cycle is divided into two basic phases:', pdfPage: 2, ncertPage: 121 },
      ]),
      b.paragraph(
        '10-1-1-list1',
        [
          { text: '• Interphase', pdfPage: 2, ncertPage: 121, clozeTerms: ['Interphase'] },
          { text: '• M Phase (Mitosis phase)', pdfPage: 2, ncertPage: 121, clozeTerms: ['M Phase (Mitosis phase)'] },
        ],
        'bullet-list',
      ),
      { type: 'diagram' as const, diagramId: 'ch10-fig-10-1' },
      b.paragraph('10-1-1-p2', [
        { text: 'The M Phase represents the phase when the actual cell division or mitosis occurs and the interphase represents the phase between two successive M phases.', pdfPage: 2, ncertPage: 121, clozeTerms: ['between two successive M phases'] },
        { text: 'It is significant to note that in the 24 hour average duration of cell cycle of a human cell, cell division proper lasts for only about an hour.', pdfPage: 2, ncertPage: 121, clozeTerms: ['about an hour'], isHighYield: true },
        { text: 'The interphase lasts more than 95% of the duration of cell cycle.', pdfPage: 2, ncertPage: 121, clozeTerms: ['more than 95%'], isHighYield: true },
      ]),
      b.paragraph('10-1-1-p3', [
        { text: 'The M Phase starts with the nuclear division, corresponding to the separation of daughter chromosomes (karyokinesis) and usually ends with division of cytoplasm (cytokinesis).', pdfPage: 2, ncertPage: 121, clozeTerms: ['karyokinesis', 'cytokinesis'], isHighYield: true },
        { text: 'The interphase, though called the resting phase, is the time during which the cell is preparing for division by undergoing both cell growth and DNA replication in an orderly manner.', pdfPage: 2, ncertPage: 121, clozeTerms: ['resting phase', 'cell growth and DNA replication'], isHighYield: true },
        { text: 'The interphase is divided into three further phases:', pdfPage: 2, ncertPage: 121 },
      ]),
      b.paragraph(
        '10-1-1-list2',
        [
          { text: '• G₁ phase (Gap 1)', pdfPage: 2, ncertPage: 121, clozeTerms: ['G₁ phase (Gap 1)'] },
          { text: '• S phase (Synthesis)', pdfPage: 2, ncertPage: 121, clozeTerms: ['S phase (Synthesis)'] },
          { text: '• G₂ phase (Gap 2)', pdfPage: 2, ncertPage: 121, clozeTerms: ['G₂ phase (Gap 2)'] },
        ],
        'bullet-list',
      ),
      b.paragraph('10-1-1-p4', [
        { text: 'G₁ phase corresponds to the interval between mitosis and initiation of DNA replication.', pdfPage: 2, ncertPage: 121, clozeTerms: ['interval between mitosis and initiation of DNA replication'], isHighYield: true },
        { text: 'During G₁ phase, the cell is metabolically active and continuously grows but does not replicate its DNA.', pdfPage: 2, ncertPage: 121, clozeTerms: ['metabolically active', 'does not replicate its DNA'], isHighYield: true },
        { text: 'S or synthesis phase marks the period during which DNA synthesis or replication takes place.', pdfPage: 2, ncertPage: 121, clozeTerms: ['DNA synthesis or replication'] },
        { text: 'During this time the amount of DNA per cell doubles.', pdfPage: 2, ncertPage: 121, clozeTerms: ['amount of DNA per cell doubles'], isHighYield: true },
        { text: 'If the initial amount of DNA is denoted as 2C then it increases to 4C.', pdfPage: 2, ncertPage: 121, clozeTerms: ['2C', '4C'], isHighYield: true },
        { text: 'However, there is no increase in the chromosome number; if the cell had diploid or 2n number of chromosomes at G₁, even after S phase the number of chromosomes remains the same, i.e., 2n.', pdfPage: 2, ncertPage: 121, clozeTerms: ['no increase in the chromosome number', '2n'], isHighYield: true },
      ]),
      b.paragraph('10-1-1-p5', [
        { text: 'In animal cells, during the S phase, DNA replication begins in the nucleus, and the centriole duplicates in the cytoplasm.', pdfPage: 2, ncertPage: 121, clozeTerms: ['animal cells', 'S phase', 'nucleus', 'centriole duplicates in the cytoplasm'], isHighYield: true },
        { text: 'During the G₂ phase, proteins are synthesised in preparation for mitosis while cell growth continues.', pdfPage: 2, ncertPage: 121, clozeTerms: ['G₂ phase', 'proteins are synthesised', 'cell growth continues'], isHighYield: true },
      ]),
      b.callout(
        'inquiry-box-1',
        'NCERT Think Box (Page 121)',
        [
          { text: 'How do plants and animals continue to grow all their lives? Do all cells in a plant divide all the time? Do you think all cells continue to divide in all plants and animals? Can you tell the name and the location of tissues having cells that divide all their life in higher plants? Do animals have similar meristematic tissues?', pdfPage: 2, ncertPage: 121, clozeTerms: ['meristematic tissues'] },
        ],
        2,
        121,
        'INQUIRY BOX',
      ),
      b.callout(
        'inquiry-box-2',
        'NCERT Numerical Problem Box — Onion Root Tip (Page 122)',
        [
          { text: 'You have studied mitosis in onion root tip cells. It has 16 chromosomes in each cell. Can you tell how many chromosomes will the cell have at G₁ phase, after S phase, and after M phase? Also, what will be the DNA content of the cells at G₁, after S and at G₂, if the content after M phase is 2C?', pdfPage: 3, ncertPage: 122, clozeTerms: ['16 chromosomes', 'G₁', 'after S', 'G₂', '2C'], isHighYield: true },
        ],
        3,
        122,
        'HIGH-YIELD NUMERICAL',
      ),
      b.paragraph('10-1-1-p6', [
        { text: 'Some cells in the adult animals do not appear to exhibit division (e.g., heart cells) and many other cells divide only occasionally, as needed to replace cells that have been lost because of injury or cell death.', pdfPage: 3, ncertPage: 122, clozeTerms: ['heart cells', 'injury or cell death'], isHighYield: true },
        { text: 'These cells that do not divide further exit G₁ phase to enter an inactive stage called quiescent stage (G₀) of the cell cycle.', pdfPage: 3, ncertPage: 122, clozeTerms: ['exit G₁ phase', 'quiescent stage (G₀)'], isHighYield: true },
        { text: 'Cells in this stage remain metabolically active but no longer proliferate unless called on to do so depending on the requirement of the organism.', pdfPage: 3, ncertPage: 122, clozeTerms: ['metabolically active', 'no longer proliferate'], isHighYield: true },
      ]),
      b.paragraph('10-1-1-p7', [
        { text: 'In animals, mitotic cell division is only seen in the diploid somatic cells.', pdfPage: 3, ncertPage: 122, clozeTerms: ['diploid somatic cells'] },
        { text: 'However, there are few exceptions to this where haploid cells divide by mitosis, for example, male honey bees.', pdfPage: 3, ncertPage: 122, clozeTerms: ['haploid cells', 'male honey bees'], isHighYield: true },
        { text: 'Against this, the plants can show mitotic divisions in both haploid and diploid cells.', pdfPage: 3, ncertPage: 122, clozeTerms: ['plants', 'both haploid and diploid cells'], isHighYield: true },
        { text: 'From your recollection of examples of alternation of generations in plants (Chapter 3) identify plant species and stages at which mitosis is seen in haploid cells.', pdfPage: 3, ncertPage: 122 },
      ]),
    ],
  },
  {
    id: 'ch10-10-2',
    number: '10.2',
    title: 'M Phase (Mitosis)',
    level: 1 as const,
    blocks: [
      b.paragraph('10-2-p1', [
        { text: 'This is the most dramatic period of the cell cycle, involving a major reorganisation of virtually all components of the cell.', pdfPage: 3, ncertPage: 122, clozeTerms: ['most dramatic period'] },
        { text: 'Since the number of chromosomes in the parent and progeny cells is the same, it is also called as equational division.', pdfPage: 3, ncertPage: 122, clozeTerms: ['equational division'], isHighYield: true },
        { text: 'Though for convenience mitosis has been divided into four stages of nuclear division (karyokinesis), it is very essential to understand that cell division is a progressive process and very clear-cut lines cannot be drawn between various stages.', pdfPage: 3, ncertPage: 122, clozeTerms: ['progressive process'] },
        { text: 'Karyokinesis involves following four stages: Prophase, Metaphase, Anaphase, Telophase.', pdfPage: 3, ncertPage: 122, clozeTerms: ['Prophase', 'Metaphase', 'Anaphase', 'Telophase'] },
      ]),
      b.paragraph('10-2-1-p1', [
        { text: '10.2.1 Prophase: Prophase which is the first stage of karyokinesis of mitosis follows the S and G₂ phases of interphase.', pdfPage: 3, ncertPage: 122, clozeTerms: ['first stage of karyokinesis', 'S and G₂ phases'] },
        { text: 'In the S and G₂ phases, the new DNA molecules formed are not distinct but intertwined.', pdfPage: 3, ncertPage: 122, clozeTerms: ['not distinct but intertwined'], isHighYield: true },
        { text: 'Prophase is marked by the initiation of condensation of chromosomal material.', pdfPage: 3, ncertPage: 122, clozeTerms: ['initiation of condensation'], isHighYield: true },
        { text: 'The chromosomal material becomes untangled during the process of chromatin condensation (Figure 10.2 a).', pdfPage: 3, ncertPage: 122, clozeTerms: ['untangled'] },
        { text: 'The centrosome, which had undergone duplication during S phase of interphase, now begins to move towards opposite poles of the cell.', pdfPage: 3, ncertPage: 122, clozeTerms: ['centrosome', 'S phase', 'opposite poles'], isHighYield: true },
        { text: 'The completion of prophase can thus be marked by the following characteristic events:', pdfPage: 3, ncertPage: 122 },
      ]),
      b.paragraph(
        '10-2-1-list',
        [
          { text: '• Chromosomal material condenses to form compact mitotic chromosomes. Chromosomes are seen to be composed of two chromatids attached together at the centromere.', pdfPage: 3, ncertPage: 122, clozeTerms: ['two chromatids', 'centromere'], isHighYield: true },
          { text: '• Centrosome which had undergone duplication during interphase, begins to move towards opposite poles of the cell. Each centrosome radiates out microtubules called asters. The two asters together with spindle fibres forms mitotic apparatus.', pdfPage: 3, ncertPage: 122, clozeTerms: ['asters', 'two asters together with spindle fibres', 'mitotic apparatus'], isHighYield: true },
        ],
        'bullet-list',
      ),
      b.paragraph('10-2-1-p2', [
        { text: 'Cells at the end of prophase, when viewed under the microscope, do not show golgi complexes, endoplasmic reticulum, nucleolus and the nuclear envelope.', pdfPage: 4, ncertPage: 123, clozeTerms: ['golgi complexes', 'endoplasmic reticulum', 'nucleolus', 'nuclear envelope'], isHighYield: true },
      ]),
      b.paragraph('10-2-2-p1', [
        { text: '10.2.2 Metaphase: The complete disintegration of the nuclear envelope marks the start of the second phase of mitosis, hence the chromosomes are spread through the cytoplasm of the cell.', pdfPage: 4, ncertPage: 123, clozeTerms: ['complete disintegration of the nuclear envelope', 'second phase of mitosis'], isHighYield: true },
        { text: 'By this stage, condensation of chromosomes is completed and they can be observed clearly under the microscope.', pdfPage: 4, ncertPage: 123, clozeTerms: ['condensation of chromosomes is completed'] },
        { text: 'This then, is the stage at which morphology of chromosomes is most easily studied.', pdfPage: 4, ncertPage: 123, clozeTerms: ['morphology of chromosomes is most easily studied'], isHighYield: true },
        { text: 'At this stage, metaphase chromosome is made up of two sister chromatids, which are held together by the centromere (Figure 10.2 b).', pdfPage: 4, ncertPage: 123, clozeTerms: ['two sister chromatids', 'centromere'] },
        { text: 'Small disc-shaped structures at the surface of the centromeres are called kinetochores.', pdfPage: 4, ncertPage: 123, clozeTerms: ['disc-shaped structures', 'kinetochores'], isHighYield: true },
        { text: 'These structures serve as the sites of attachment of spindle fibres to the chromosomes that are moved into position at the centre of the cell.', pdfPage: 4, ncertPage: 123, clozeTerms: ['sites of attachment of spindle fibres'] },
        { text: 'Hence, the metaphase is characterised by all the chromosomes coming to lie at the equator with one chromatid of each chromosome connected by its kinetochore to spindle fibres from one pole and its sister chromatid connected by its kinetochore to spindle fibres from the opposite pole (Figure 10.2 b).', pdfPage: 4, ncertPage: 123, clozeTerms: ['equator', 'opposite pole'] },
        { text: 'The plane of alignment of the chromosomes at metaphase is referred to as the metaphase plate.', pdfPage: 4, ncertPage: 123, clozeTerms: ['metaphase plate'] },
        { text: 'The key features of metaphase are:', pdfPage: 4, ncertPage: 123 },
      ]),
      b.paragraph(
        '10-2-2-list',
        [
          { text: '• Spindle fibres attach to kinetochores of chromosomes.', pdfPage: 4, ncertPage: 123, clozeTerms: ['kinetochores'] },
          { text: '• Chromosomes are moved to spindle equator and get aligned along metaphase plate through spindle fibres to both poles.', pdfPage: 4, ncertPage: 123, clozeTerms: ['spindle equator', 'metaphase plate'] },
        ],
        'bullet-list',
      ),
      { type: 'diagram' as const, diagramId: 'ch10-fig-10-2ab' },
      b.paragraph('10-2-3-p1', [
        { text: '10.2.3 Anaphase: At the onset of anaphase, each chromosome arranged at the metaphase plate is split simultaneously and the two daughter chromatids, now referred to as daughter chromosomes of the future daughter nuclei, begin their migration towards the two opposite poles.', pdfPage: 4, ncertPage: 123, clozeTerms: ['split simultaneously', 'daughter chromosomes'], isHighYield: true },
        { text: 'As each chromosome moves away from the equatorial plate, the centromere of each chromosome remains directed towards the pole and hence at the leading edge, with the arms of the chromosome trailing behind (Figure 10.2 c).', pdfPage: 4, ncertPage: 123, clozeTerms: ['centromere', 'leading edge', 'arms', 'trailing behind'], isHighYield: true },
        { text: 'Thus, anaphase stage is characterised by the following key events:', pdfPage: 4, ncertPage: 123 },
      ]),
      b.paragraph(
        '10-2-3-list',
        [
          { text: '• Centromeres split and chromatids separate.', pdfPage: 5, ncertPage: 124, clozeTerms: ['Centromeres split', 'chromatids separate'], isHighYield: true },
          { text: '• Chromatids move to opposite poles.', pdfPage: 5, ncertPage: 124 },
        ],
        'bullet-list',
      ),
      b.paragraph('10-2-4-p1', [
        { text: '10.2.4 Telophase: At the beginning of the final stage of karyokinesis, i.e., telophase, the chromosomes that have reached their respective poles decondense and lose their individuality.', pdfPage: 5, ncertPage: 124, clozeTerms: ['decondense and lose their individuality'], isHighYield: true },
        { text: 'The individual chromosomes can no longer be seen and each set of chromatin material tends to collect at each of the two poles (Figure 10.2 d).', pdfPage: 5, ncertPage: 124 },
        { text: 'This is the stage which shows the following key events:', pdfPage: 5, ncertPage: 124 },
      ]),
      b.paragraph(
        '10-2-4-list',
        [
          { text: '• Chromosomes cluster at opposite spindle poles and their identity is lost as discrete elements.', pdfPage: 5, ncertPage: 124, clozeTerms: ['identity is lost as discrete elements'] },
          { text: '• Nuclear envelope develops around the chromosome clusters at each pole forming two daughter nuclei.', pdfPage: 5, ncertPage: 124, clozeTerms: ['Nuclear envelope develops'] },
          { text: '• Nucleolus, golgi complex and ER reform.', pdfPage: 5, ncertPage: 124, clozeTerms: ['Nucleolus, golgi complex and ER reform'], isHighYield: true },
        ],
        'bullet-list',
      ),
      { type: 'diagram' as const, diagramId: 'ch10-fig-10-2ce' },
      b.paragraph('10-2-5-p1', [
        { text: '10.2.5 Cytokinesis: Mitosis accomplishes not only the segregation of duplicated chromosomes into daughter nuclei (karyokinesis), but the cell itself is divided into two daughter cells by the separation of cytoplasm called cytokinesis at the end of which cell division gets completed (Figure 10.2 e).', pdfPage: 5, ncertPage: 124, clozeTerms: ['separation of cytoplasm', 'cytokinesis'] },
        { text: 'In an animal cell, this is achieved by the appearance of a furrow in the plasma membrane.', pdfPage: 5, ncertPage: 124, clozeTerms: ['animal cell', 'furrow in the plasma membrane'], isHighYield: true },
        { text: 'The furrow gradually deepens and ultimately joins in the centre dividing the cell cytoplasm into two.', pdfPage: 5, ncertPage: 124 },
        { text: 'Plant cells however, are enclosed by a relatively inextensible cell wall, therefore they undergo cytokinesis by a different mechanism.', pdfPage: 5, ncertPage: 124, clozeTerms: ['inextensible cell wall'] },
        { text: 'In plant cells, wall formation starts in the centre of the cell and grows outward to meet the existing lateral walls.', pdfPage: 5, ncertPage: 124, clozeTerms: ['starts in the centre', 'grows outward'], isHighYield: true },
        { text: 'The formation of the new cell wall begins with the formation of a simple precursor, called the cell-plate that represents the middle lamella between the walls of two adjacent cells.', pdfPage: 5, ncertPage: 124, clozeTerms: ['cell-plate', 'middle lamella'], isHighYield: true },
        { text: 'At the time of cytoplasmic division, organelles like mitochondria and plastids get distributed between the two daughter cells.', pdfPage: 5, ncertPage: 124, clozeTerms: ['mitochondria and plastids'] },
        { text: 'In some organisms karyokinesis is not followed by cytokinesis as a result of which multinucleate condition arises leading to the formation of syncytium (e.g., liquid endosperm in coconut).', pdfPage: 5, ncertPage: 124, clozeTerms: ['multinucleate condition', 'syncytium', 'liquid endosperm in coconut'], isHighYield: true },
      ]),
    ],
  },
  {
    id: 'ch10-10-3',
    number: '10.3',
    title: 'Significance of Mitosis',
    level: 1 as const,
    blocks: [
      b.paragraph('10-3-p1', [
        { text: 'Mitosis or the equational division is usually restricted to the diploid cells only.', pdfPage: 6, ncertPage: 125 },
        { text: 'However, in some lower plants and in some social insects haploid cells also divide by mitosis.', pdfPage: 6, ncertPage: 125, clozeTerms: ['lower plants', 'social insects', 'haploid cells'], isHighYield: true },
        { text: 'It is very essential to understand the significance of this division in the life of an organism.', pdfPage: 6, ncertPage: 125 },
        { text: 'Are you aware of some examples where you have studied about haploid and diploid insects?', pdfPage: 6, ncertPage: 125 },
      ]),
      b.paragraph('10-3-p2', [
        { text: 'Mitosis usually results in the production of diploid daughter cells with identical genetic complement.', pdfPage: 6, ncertPage: 125, clozeTerms: ['identical genetic complement'] },
        { text: 'The growth of multicellular organisms is due to mitosis.', pdfPage: 6, ncertPage: 125 },
        { text: 'Cell growth results in disturbing the ratio between the nucleus and the cytoplasm.', pdfPage: 6, ncertPage: 125, clozeTerms: ['ratio between the nucleus and the cytoplasm'] },
        { text: 'It therefore becomes essential for the cell to divide to restore the nucleo-cytoplasmic ratio.', pdfPage: 6, ncertPage: 125, clozeTerms: ['restore the nucleo-cytoplasmic ratio'], isHighYield: true },
        { text: 'A very significant contribution of mitosis is cell repair.', pdfPage: 6, ncertPage: 125, clozeTerms: ['cell repair'] },
        { text: 'The cells of the upper layer of the epidermis, cells of the lining of the gut, and blood cells are being constantly replaced.', pdfPage: 6, ncertPage: 125, clozeTerms: ['upper layer of the epidermis', 'lining of the gut', 'blood cells'], isHighYield: true },
        { text: 'Mitotic divisions in the meristematic tissues – the apical and the lateral cambium, result in a continuous growth of plants throughout their life.', pdfPage: 6, ncertPage: 125, clozeTerms: ['meristematic tissues', 'apical and the lateral cambium'], isHighYield: true },
      ]),
    ],
  },
  {
    id: 'ch10-10-4',
    number: '10.4',
    title: 'Meiosis',
    level: 1 as const,
    blocks: [
      b.paragraph('10-4-p1', [
        { text: 'The production of offspring by sexual reproduction includes the fusion of two gametes, each with a complete haploid set of chromosomes.', pdfPage: 6, ncertPage: 125 },
        { text: 'Gametes are formed from specialised diploid cells.', pdfPage: 6, ncertPage: 125, clozeTerms: ['specialised diploid cells'] },
        { text: 'This specialised kind of cell division that reduces the chromosome number by half results in the production of haploid daughter cells.', pdfPage: 6, ncertPage: 125, clozeTerms: ['reduces the chromosome number by half'] },
        { text: 'This kind of division is called meiosis.', pdfPage: 6, ncertPage: 125, clozeTerms: ['meiosis'] },
        { text: 'Meiosis ensures the production of haploid phase in the life cycle of sexually reproducing organisms whereas fertilisation restores the diploid phase.', pdfPage: 6, ncertPage: 125, clozeTerms: ['haploid phase', 'fertilisation restores the diploid phase'], isHighYield: true },
        { text: 'We come across meiosis during gametogenesis in plants and animals.', pdfPage: 6, ncertPage: 125, clozeTerms: ['gametogenesis'] },
        { text: 'This leads to the formation of haploid gametes.', pdfPage: 6, ncertPage: 125 },
        { text: 'The key features of meiosis are as follows:', pdfPage: 6, ncertPage: 125 },
      ]),
      b.paragraph(
        '10-4-list',
        [
          { text: '• Meiosis involves two sequential cycles of nuclear and cell division called meiosis I and meiosis II but only a single cycle of DNA replication.', pdfPage: 6, ncertPage: 125, clozeTerms: ['two sequential cycles', 'single cycle of DNA replication'], isHighYield: true },
          { text: '• Meiosis I is initiated after the parental chromosomes have replicated to produce identical sister chromatids at the S phase.', pdfPage: 6, ncertPage: 125, clozeTerms: ['identical sister chromatids', 'S phase'] },
          { text: '• Meiosis involves pairing of homologous chromosomes and recombination between non-sister chromatids of homologous chromosomes.', pdfPage: 6, ncertPage: 125, clozeTerms: ['pairing of homologous chromosomes', 'recombination between non-sister chromatids'], isHighYield: true },
          { text: '• Four haploid cells are formed at the end of meiosis II.', pdfPage: 6, ncertPage: 125, clozeTerms: ['Four haploid cells'] },
        ],
        'bullet-list',
      ),
      {
        type: 'table' as const,
        id: 'ch10-table-meiosis',
        tableNumber: 'TABLE 10.1',
        title: 'Meiotic Events Grouped Under Phases',
        headers: ['Meiosis I', 'Meiosis II'],
        rows: [
          ['Prophase I', 'Prophase II'],
          ['Metaphase I', 'Metaphase II'],
          ['Anaphase I', 'Anaphase II'],
          ['Telophase I', 'Telophase II'],
        ],
        pdfPage: 6,
        ncertPage: 125,
      },
    ],
  },
  {
    id: 'ch10-10-4-1',
    number: '10.4.1',
    title: 'Meiosis I',
    level: 2 as const,
    blocks: [
      b.paragraph('10-4-1-p1', [
        { text: 'Prophase I: Prophase of the first meiotic division is typically longer and more complex when compared to prophase of mitosis.', pdfPage: 7, ncertPage: 126, clozeTerms: ['longer and more complex'] },
        { text: 'It has been further subdivided into the following five phases based on chromosomal behaviour, i.e., Leptotene, Zygotene, Pachytene, Diplotene and Diakinesis.', pdfPage: 7, ncertPage: 126, clozeTerms: ['chromosomal behaviour', 'Leptotene, Zygotene, Pachytene, Diplotene and Diakinesis'], isHighYield: true },
      ]),
      b.paragraph('10-4-1-p2', [
        { text: 'During leptotene stage the chromosomes become gradually visible under the light microscope.', pdfPage: 7, ncertPage: 126, clozeTerms: ['leptotene', 'light microscope'], isHighYield: true },
        { text: 'The compaction of chromosomes continues throughout leptotene.', pdfPage: 7, ncertPage: 126, clozeTerms: ['compaction of chromosomes'] },
        { text: 'This is followed by the second stage of prophase I called zygotene.', pdfPage: 7, ncertPage: 126, clozeTerms: ['zygotene'] },
        { text: 'During this stage, chromosomes start pairing together and this process of association is called synapsis.', pdfPage: 7, ncertPage: 126, clozeTerms: ['pairing together', 'synapsis'], isHighYield: true },
        { text: 'Such paired chromosomes are called homologous chromosomes.', pdfPage: 7, ncertPage: 126, clozeTerms: ['homologous chromosomes'] },
        { text: 'Electron micrographs of this stage, indicate that chromosome synapsis is accompanied by the formation of complex structure called synaptonemal complex.', pdfPage: 7, ncertPage: 126, clozeTerms: ['Electron micrographs', 'synaptonemal complex'], isHighYield: true },
        { text: 'The complex formed by a pair of synapsed homologous chromosomes is called a bivalent or a tetrad.', pdfPage: 7, ncertPage: 126, clozeTerms: ['bivalent', 'tetrad'], isHighYield: true },
        { text: 'However, these are more clearly visible at the next stage.', pdfPage: 7, ncertPage: 126, clozeTerms: ['more clearly visible at the next stage'], isHighYield: true },
        { text: 'The first two stages of prophase I are relatively short-lived compared to the next stage that is pachytene.', pdfPage: 7, ncertPage: 126, clozeTerms: ['relatively short-lived', 'pachytene'], isHighYield: true },
        { text: 'During this stage, the four chromatids of each bivalent chromosomes becomes distinct and clearly appear as tetrads.', pdfPage: 7, ncertPage: 126, clozeTerms: ['four chromatids', 'clearly appear as tetrads'], isHighYield: true },
        { text: 'This stage is characterised by the appearance of recombination nodules, the sites at which crossing over occurs between non-sister chromatids of the homologous chromosomes.', pdfPage: 7, ncertPage: 126, clozeTerms: ['recombination nodules', 'crossing over', 'non-sister chromatids'], isHighYield: true },
        { text: 'Crossing over is the exchange of genetic material between two homologous chromosomes.', pdfPage: 7, ncertPage: 126, clozeTerms: ['exchange of genetic material'] },
        { text: 'Crossing over is also an enzyme-mediated process and the enzyme involved is called recombinase.', pdfPage: 7, ncertPage: 126, clozeTerms: ['enzyme-mediated process', 'recombinase'], isHighYield: true },
        { text: 'Crossing over leads to recombination of genetic material on the two chromosomes.', pdfPage: 7, ncertPage: 126 },
        { text: 'Recombination between homologous chromosomes is completed by the end of pachytene, leaving the chromosomes linked at the sites of crossing over.', pdfPage: 7, ncertPage: 126, clozeTerms: ['completed by the end of pachytene', 'linked at the sites of crossing over'], isHighYield: true },
      ]),
      b.paragraph('10-4-1-p3', [
        { text: 'The beginning of diplotene is recognised by the dissolution of the synaptonemal complex and the tendency of the recombined homologous chromosomes of the bivalents to separate from each other except at the sites of crossovers.', pdfPage: 7, ncertPage: 126, clozeTerms: ['diplotene', 'dissolution of the synaptonemal complex', 'except at the sites of crossovers'], isHighYield: true },
        { text: 'These X-shaped structures, are called chiasmata.', pdfPage: 7, ncertPage: 126, clozeTerms: ['X-shaped structures', 'chiasmata'], isHighYield: true },
        { text: 'In oocytes of some vertebrates, diplotene can last for months or years.', pdfPage: 7, ncertPage: 126, clozeTerms: ['oocytes of some vertebrates', 'months or years'], isHighYield: true },
      ]),
      b.paragraph('10-4-1-p4', [
        { text: 'The final stage of meiotic prophase I is diakinesis.', pdfPage: 7, ncertPage: 126, clozeTerms: ['diakinesis'] },
        { text: 'This is marked by terminalisation of chiasmata.', pdfPage: 7, ncertPage: 126, clozeTerms: ['terminalisation of chiasmata'], isHighYield: true },
        { text: 'During this phase the chromosomes are fully condensed and the meiotic spindle is assembled to prepare the homologous chromosomes for separation.', pdfPage: 7, ncertPage: 126, clozeTerms: ['fully condensed', 'meiotic spindle is assembled'] },
        { text: 'By the end of diakinesis, the nucleolus disappears and the nuclear envelope also breaks down.', pdfPage: 7, ncertPage: 126, clozeTerms: ['nucleolus disappears', 'nuclear envelope also breaks down'], isHighYield: true },
        { text: 'Diakinesis represents transition to metaphase.', pdfPage: 7, ncertPage: 126, clozeTerms: ['transition to metaphase'], isHighYield: true },
      ]),
      b.paragraph('10-4-1-p5', [
        { text: 'Metaphase I: The bivalent chromosomes align on the equatorial plate (Figure 10.3).', pdfPage: 7, ncertPage: 126, clozeTerms: ['bivalent chromosomes', 'equatorial plate'] },
        { text: 'The microtubules from the opposite poles of the spindle attach to the kinetochore of homologous chromosomes.', pdfPage: 7, ncertPage: 126, clozeTerms: ['kinetochore of homologous chromosomes'], isHighYield: true },
      ]),
      { type: 'diagram' as const, diagramId: 'ch10-fig-10-3' },
      b.paragraph('10-4-1-p6', [
        { text: 'Anaphase I: The homologous chromosomes separate, while sister chromatids remain associated at their centromeres (Figure 10.3).', pdfPage: 8, ncertPage: 127, clozeTerms: ['homologous chromosomes separate', 'sister chromatids remain associated at their centromeres'], isHighYield: true },
      ]),
      b.paragraph('10-4-1-p7', [
        { text: 'Telophase I: The nuclear membrane and nucleolus reappear, cytokinesis follows and this is called as dyad of cells (Figure 10.3).', pdfPage: 8, ncertPage: 127, clozeTerms: ['nuclear membrane and nucleolus reappear', 'dyad of cells'], isHighYield: true },
        { text: 'Although in many cases the chromosomes do undergo some dispersion, they do not reach the extremely extended state of the interphase nucleus.', pdfPage: 8, ncertPage: 127, clozeTerms: ['do not reach the extremely extended state'] },
        { text: 'The stage between the two meiotic divisions is called interkinesis and is generally short lived.', pdfPage: 8, ncertPage: 127, clozeTerms: ['interkinesis', 'short lived'], isHighYield: true },
        { text: 'There is no replication of DNA during interkinesis.', pdfPage: 8, ncertPage: 127, clozeTerms: ['no replication of DNA during interkinesis'], isHighYield: true },
        { text: 'Interkinesis is followed by prophase II, a much simpler prophase than prophase I.', pdfPage: 8, ncertPage: 127, clozeTerms: ['prophase II'] },
      ]),
    ],
  },
  {
    id: 'ch10-10-4-2',
    number: '10.4.2',
    title: 'Meiosis II',
    level: 2 as const,
    blocks: [
      b.paragraph('10-4-2-p1', [
        { text: 'Prophase II: Meiosis II is initiated immediately after cytokinesis, usually before the chromosomes have fully elongated.', pdfPage: 8, ncertPage: 127, clozeTerms: ['immediately after cytokinesis', 'before the chromosomes have fully elongated'] },
        { text: 'In contrast to meiosis I, meiosis II resembles a normal mitosis.', pdfPage: 8, ncertPage: 127, clozeTerms: ['resembles a normal mitosis'] },
        { text: 'The nuclear membrane disappears by the end of prophase II (Figure 10.4).', pdfPage: 8, ncertPage: 127 },
        { text: 'The chromosomes again become compact.', pdfPage: 8, ncertPage: 127 },
      ]),
      b.paragraph('10-4-2-p2', [
        { text: 'Metaphase II: At this stage, the chromosomes align at the equator and the microtubules from opposite poles of the spindle get attached to the kinetochores (Figure 10.4) of sister chromatids.', pdfPage: 8, ncertPage: 127, clozeTerms: ['kinetochores', 'sister chromatids'], isHighYield: true },
      ]),
      b.paragraph('10-4-2-p3', [
        { text: 'Anaphase II: It begins with the simultaneous splitting of the centromere of each chromosome (which was holding the sister chromatids together), allowing them to move toward opposite poles of the cell (Figure 10.4) by shortening of microtubules attached to kinetochores.', pdfPage: 8, ncertPage: 127, clozeTerms: ['simultaneous splitting of the centromere', 'shortening of microtubules attached to kinetochores'], isHighYield: true },
      ]),
      { type: 'diagram' as const, diagramId: 'ch10-fig-10-4' },
      b.paragraph('10-4-2-p4', [
        { text: 'Telophase II: Meiosis ends with telophase II, in which the two groups of chromosomes once again get enclosed by a nuclear envelope; cytokinesis follows resulting in the formation of tetrad of cells i.e., four haploid daughter cells (Figure 10.4).', pdfPage: 9, ncertPage: 128, clozeTerms: ['tetrad of cells', 'four haploid daughter cells'], isHighYield: true },
      ]),
    ],
  },
  {
    id: 'ch10-10-5',
    number: '10.5',
    title: 'Significance of Meiosis',
    level: 1 as const,
    blocks: [
      b.paragraph('10-5-p1', [
        { text: 'Meiosis is the mechanism by which conservation of specific chromosome number of each species is achieved across generations in sexually reproducing organisms, even though the process, per se, paradoxically, results in reduction of chromosome number by half.', pdfPage: 9, ncertPage: 128, clozeTerms: ['conservation of specific chromosome number', 'paradoxically', 'reduction of chromosome number by half'], isHighYield: true },
        { text: 'It also increases the genetic variability in the population of organisms from one generation to the next.', pdfPage: 9, ncertPage: 128, clozeTerms: ['genetic variability'], isHighYield: true },
        { text: 'Variations are very important for the process of evolution.', pdfPage: 9, ncertPage: 128, clozeTerms: ['evolution'] },
      ]),
    ],
  },
  {
    id: 'ch10-summary',
    number: 'Summary',
    title: 'NCERT Chapter Summary',
    level: 1 as const,
    blocks: [
      b.paragraph(
        'summary-p1',
        [
          { text: 'According to the cell theory, cells arise from preexisting cells.', pdfPage: 9, ncertPage: 128 },
          { text: 'The process by which this occurs is called cell division.', pdfPage: 9, ncertPage: 128 },
          { text: 'Any sexually reproducing organism starts its life cycle from a single-celled zygote.', pdfPage: 9, ncertPage: 128 },
          { text: 'Cell division does not stop with the formation of the mature organism but continues throughout its life cycle.', pdfPage: 9, ncertPage: 128 },
        ],
        'summary',
      ),
      b.paragraph(
        'summary-p2',
        [
          { text: 'The stages through which a cell passes from one division to the next is called the cell cycle.', pdfPage: 10, ncertPage: 129 },
          { text: 'Cell cycle is divided into two phases called (i) Interphase – a period of preparation for cell division, and (ii) Mitosis (M phase) – the actual period of cell division.', pdfPage: 10, ncertPage: 129 },
          { text: 'Interphase is further subdivided into G₁, S and G₂.', pdfPage: 10, ncertPage: 129 },
          { text: 'G₁ phase is the period when the cell grows and carries out normal metabolism.', pdfPage: 10, ncertPage: 129 },
          { text: 'Most of the organelle duplication also occurs during this phase.', pdfPage: 10, ncertPage: 129, clozeTerms: ['Most of the organelle duplication', 'G₁'], isHighYield: true },
          { text: 'S phase marks the phase of DNA replication and chromosome duplication.', pdfPage: 10, ncertPage: 129, clozeTerms: ['DNA replication and chromosome duplication'], isHighYield: true },
          { text: 'G₂ phase is the period of cytoplasmic growth.', pdfPage: 10, ncertPage: 129, clozeTerms: ['cytoplasmic growth'], isHighYield: true },
          { text: 'Mitosis is also divided into four stages namely prophase, metaphase, anaphase and telophase.', pdfPage: 10, ncertPage: 129 },
          { text: 'Chromosome condensation occurs during prophase.', pdfPage: 10, ncertPage: 129 },
          { text: 'Simultaneously, the centrioles move to the opposite poles.', pdfPage: 10, ncertPage: 129 },
          { text: 'The nuclear envelope and the nucleolus disappear and the spindle fibres start appearing.', pdfPage: 10, ncertPage: 129 },
          { text: 'Metaphase is marked by the alignment of chromosomes at the equatorial plate.', pdfPage: 10, ncertPage: 129 },
          { text: 'During anaphase the centromeres divide and the chromatids start moving towards the two opposite poles.', pdfPage: 10, ncertPage: 129 },
          { text: 'Once the chromatids reach the two poles, the chromosomal elongation starts, nucleolus and the nuclear membrane reappear.', pdfPage: 10, ncertPage: 129 },
          { text: 'This stage is called the telophase.', pdfPage: 10, ncertPage: 129 },
          { text: 'Nuclear division is then followed by the cytoplasmic division and is called cytokinesis.', pdfPage: 10, ncertPage: 129 },
          { text: 'Mitosis thus, is the equational division in which the chromosome number of the parent is conserved in the daughter cell.', pdfPage: 10, ncertPage: 129 },
        ],
        'summary',
      ),
      b.paragraph(
        'summary-p3',
        [
          { text: 'In contrast to mitosis, meiosis occurs in the diploid cells, which are destined to form gametes.', pdfPage: 10, ncertPage: 129 },
          { text: 'It is called the reduction division since it reduces the chromosome number by half while making the gametes.', pdfPage: 10, ncertPage: 129 },
          { text: 'In sexual reproduction when the two gametes fuse the chromosome number is restored to the value in the parent.', pdfPage: 10, ncertPage: 129 },
          { text: 'Meiosis is divided into two phases – meiosis I and meiosis II.', pdfPage: 10, ncertPage: 129 },
          { text: 'In the first meiotic division the homologous chromosomes pair to form bivalents, and undergo crossing over.', pdfPage: 10, ncertPage: 129 },
          { text: 'Meiosis I has a long prophase, which is divided further into five phases.', pdfPage: 10, ncertPage: 129 },
          { text: 'These are leptotene, zygotene, pachytene, diplotene and diakinesis.', pdfPage: 10, ncertPage: 129 },
          { text: 'During metaphase I the bivalents arrange on the equatorial plate.', pdfPage: 10, ncertPage: 129 },
          { text: 'This is followed by anaphase I in which homologous chromosomes move to the opposite poles with both their chromatids.', pdfPage: 10, ncertPage: 129 },
          { text: 'Each pole receives half the chromosome number of the parent cell.', pdfPage: 10, ncertPage: 129 },
          { text: 'In telophase I, the nuclear membrane and nucleolus reappear.', pdfPage: 10, ncertPage: 129 },
          { text: 'Meiosis II is similar to mitosis.', pdfPage: 10, ncertPage: 129 },
          { text: 'During anaphase II the sister chromatids separate.', pdfPage: 10, ncertPage: 129 },
          { text: 'Thus at the end of meiosis four haploid cells are formed.', pdfPage: 10, ncertPage: 129 },
        ],
        'summary',
      ),
    ],
  },
  {
    id: 'ch10-exercises',
    number: 'Exercises',
    title: 'NCERT Back Exercises',
    level: 1 as const,
    blocks: [
      b.paragraph(
        'ex-list',
        [
          { text: '1. What is the average cell cycle span for a mammalian cell?', pdfPage: 10, ncertPage: 129 },
          { text: '2. Distinguish cytokinesis from karyokinesis.', pdfPage: 10, ncertPage: 129 },
          { text: '3. Describe the events taking place during interphase.', pdfPage: 10, ncertPage: 129 },
          { text: '4. What is G₀ (quiescent phase) of cell cycle?', pdfPage: 10, ncertPage: 129 },
          { text: '5. Why is mitosis called equational division?', pdfPage: 11, ncertPage: 130 },
          { text: '6. Name the stage of cell cycle at which one of the following events occur: (i) Chromosomes are moved to spindle equator. (ii) Centromere splits and chromatids separate. (iii) Pairing between homologous chromosomes takes place. (iv) Crossing over between homologous chromosomes takes place.', pdfPage: 11, ncertPage: 130 },
          { text: '7. Describe the following: (a) synapsis (b) bivalent (c) chiasmata. Draw a diagram to illustrate your answer.', pdfPage: 11, ncertPage: 130 },
          { text: '8. How does cytokinesis in plant cells differ from that in animal cells?', pdfPage: 11, ncertPage: 130 },
          { text: '9. Find examples where the four daughter cells from meiosis are equal in size and where they are found unequal in size.', pdfPage: 11, ncertPage: 130 },
          { text: '10. Distinguish anaphase of mitosis from anaphase I of meiosis.', pdfPage: 11, ncertPage: 130 },
          { text: '11. List the main differences between mitosis and meiosis.', pdfPage: 11, ncertPage: 130 },
          { text: '12. What is the significance of meiosis?', pdfPage: 11, ncertPage: 130 },
          { text: '13. Discuss with your teacher about (i) haploid insects and lower plants where cell-division occurs, and (ii) some haploid cells in higher plants where cell-division does not occur.', pdfPage: 11, ncertPage: 130 },
          { text: '14. Can there be mitosis without DNA replication in ‘S’ phase?', pdfPage: 11, ncertPage: 130 },
          { text: '15. Can there be DNA replication without cell division?', pdfPage: 11, ncertPage: 130 },
          { text: '16. Analyse the events during every stage of cell cycle and notice how the following two parameters change: (i) number of chromosomes (N) per cell (ii) amount of DNA content (C) per cell.', pdfPage: 11, ncertPage: 130 },
        ],
        'exercise',
      ),
    ],
  },
];

const vault: VaultItem[] = [
  // Scientists & Years (concepts & foundational laws referenced)
  { id: 'ch10-v-sci-1', category: 'scientists_years', prompt: 'Cell Theory Continuity (Rudolf Virchow Cross-Link)', detail: 'Summary p.128 reiterates Cell Theory: "cells arise from preexisting cells" — the foundational principle driving all cell division.', sourceLineId: 'ch10-summary-p1-l1', ncertPage: 128 },

  // Numbers & Dimensions
  { id: 'ch10-v-num-1', category: 'numbers_dimensions', prompt: 'Human Cell Cycle Duration vs. M Phase', detail: 'Total cycle ≈ 24 hours; actual M Phase (cell division proper) ≈ 1 hour; Interphase > 95% of cell cycle.', sourceLineId: 'ch10-10-1-1-p2-l3', ncertPage: 121 },
  { id: 'ch10-v-num-2', category: 'numbers_dimensions', prompt: 'Yeast Cell Cycle Duration', detail: 'Only about 90 minutes.', sourceLineId: 'ch10-10-1-1-p1-l4', ncertPage: 121 },
  { id: 'ch10-v-num-3', category: 'numbers_dimensions', prompt: 'DNA Content (C) & Chromosome Count (n) Across S Phase', detail: 'DNA doubles from 2C → 4C during S phase; chromosome number DOES NOT increase (remains 2n).', sourceLineId: 'ch10-10-1-1-p4-l6', ncertPage: 121 },
  { id: 'ch10-v-num-4', category: 'numbers_dimensions', prompt: 'Onion Root Tip Numerical Solution (Page 122 Box)', detail: 'Given 2n = 16 and DNA after M = 2C: G₁ → 16 chromosomes, 2C · After S → 16 chromosomes, 4C · G₂ → 16 chromosomes, 4C · After M → 16 chromosomes, 2C.', sourceLineId: 'ch10-inquiry-box-2-l1', ncertPage: 122 },
  { id: 'ch10-v-num-5', category: 'numbers_dimensions', prompt: 'Meiosis Cycles & Output', detail: '2 sequential nuclear/cell divisions (Meiosis I & II) + ONLY 1 cycle of DNA replication → 4 haploid daughter cells (tetrad of cells).', sourceLineId: 'ch10-10-4-list-l1', ncertPage: 125 },
  { id: 'ch10-v-num-6', category: 'numbers_dimensions', prompt: 'Diplotene Duration in Vertebrate Oocytes', detail: 'Can last for months or years in oocytes of some vertebrates.', sourceLineId: 'ch10-10-4-1-p3-l3', ncertPage: 126 },

  // Examples & Exceptions
  { id: 'ch10-v-ex-1', category: 'examples_exceptions', prompt: 'Quiescent Stage (G₀) Example', detail: 'Adult animal heart cells do not exhibit division and exit G₁ to enter G₀ (metabolically active, non-proliferating).', sourceLineId: 'ch10-10-1-1-p6-l1', ncertPage: 122 },
  { id: 'ch10-v-ex-2', category: 'examples_exceptions', prompt: 'Haploid Mitosis Exception in Animals', detail: 'Male honey bees (social insects) show mitosis in haploid cells; plants show mitosis in BOTH haploid and diploid cells.', sourceLineId: 'ch10-10-1-1-p7-l2', ncertPage: 122 },
  { id: 'ch10-v-ex-3', category: 'examples_exceptions', prompt: 'Syncytium Example', detail: 'Liquid endosperm in coconut — karyokinesis not followed by cytokinesis creates a multinucleate syncytium.', sourceLineId: 'ch10-10-2-5-p1-l8', ncertPage: 124 },
  { id: 'ch10-v-ex-4', category: 'examples_exceptions', prompt: 'Constantly Replaced Cells & Plant Growth Meristems', detail: 'Replaced by mitosis: upper layer of epidermis, lining of gut, blood cells. Plant continuous growth: apical and lateral cambium meristematic tissues.', sourceLineId: 'ch10-10-3-p2-l6', ncertPage: 125 },
  { id: 'ch10-v-ex-5', category: 'examples_exceptions', prompt: 'Enzyme Mediating Crossing Over', detail: 'Recombinase mediates crossing over between non-sister chromatids at recombination nodules during Pachytene.', sourceLineId: 'ch10-10-4-1-p2-l13', ncertPage: 126 },

  // Equations & Tables
  { id: 'ch10-v-eq-1', category: 'equations_tables', prompt: 'Prophase I — 5 Sub-stages (L-Z-P-D-D) Master Sequence', detail: 'Leptotene (compaction, visible under light microscope) → Zygotene (synapsis, synaptonemal complex via EM, bivalent/tetrad formed) → Pachytene (tetrads clearly visible, recombination nodules, crossing over via recombinase) → Diplotene (synaptonemal complex dissolves, X-shaped chiasmata) → Diakinesis (terminalisation of chiasmata, spindle assembles, nucleolus & nuclear envelope break down).', sourceLineId: 'ch10-10-4-1-p1-l2', ncertPage: 126 },
  { id: 'ch10-v-eq-2', category: 'equations_tables', prompt: 'Animal vs. Plant Cytokinesis Direction', detail: 'Animal cell: plasma membrane furrow deepens INWARD (centripetal). Plant cell: cell-plate (= middle lamella) starts in the CENTRE and grows OUTWARD (centrifugal) to lateral walls.', sourceLineId: 'ch10-10-2-5-p1-l5', ncertPage: 124 },
  { id: 'ch10-v-eq-3', category: 'equations_tables', prompt: 'Anaphase (Mitosis) vs. Anaphase I vs. Anaphase II', detail: 'Mitosis Anaphase: centromeres split, sister chromatids separate. Meiosis Anaphase I: homologous chromosomes separate, sister chromatids STAY attached at centromeres. Meiosis Anaphase II: centromeres split simultaneously, sister chromatids separate.', sourceLineId: 'ch10-10-4-1-p6-l1', ncertPage: 127 },

  // NCERT Word Traps
  { id: 'ch10-v-trap-1', category: 'word_traps', prompt: 'Bivalent Forms in Zygotene, CLEARLY VISIBLE in Pachytene', detail: 'Classic NEET trap: synapsis & bivalent/tetrad formation begin in Zygotene, but the four chromatids become distinct and CLEARLY appear as tetrads in Pachytene!', sourceLineId: 'ch10-10-4-1-p2-l8', ncertPage: 126 },
  { id: 'ch10-v-trap-2', category: 'word_traps', prompt: 'NO DNA Replication During Interkinesis', detail: 'Interkinesis lies between Meiosis I and Meiosis II, is short-lived, and has ZERO DNA replication.', sourceLineId: 'ch10-10-4-1-p7-l4', ncertPage: 127 },
  { id: 'ch10-v-trap-3', category: 'word_traps', prompt: 'Summary-Only G₁ Trap: Most Organelle Duplication Occurs in G₁', detail: 'Text p.121 highlights centriole duplication in S phase, while Summary p.129 specifically states: "Most of the organelle duplication also occurs during this phase [G₁]" and "G₂ phase is the period of cytoplasmic growth"!', sourceLineId: 'ch10-summary-p2-l5', ncertPage: 129 },
  { id: 'ch10-v-trap-4', category: 'word_traps', prompt: 'Centriole Duplicates in CYTOPLASM During S Phase (Animal Cells)', detail: 'In animal cells during S phase, DNA replication begins in the NUCLEUS while centriole duplicates in the CYTOPLASM.', sourceLineId: 'ch10-10-1-1-p5-l1', ncertPage: 121 },
  { id: 'ch10-v-trap-5', category: 'word_traps', prompt: 'Metaphase Starts With COMPLETE Disintegration of Nuclear Envelope', detail: 'End of prophase loses Golgi, ER, nucleolus & nuclear envelope; COMPLETE disintegration of the nuclear envelope marks the START of Metaphase (best stage to study chromosome morphology).', sourceLineId: 'ch10-10-2-2-p1-l1', ncertPage: 123 },
  { id: 'ch10-v-trap-6', category: 'word_traps', prompt: 'Mitotic Apparatus = Two Asters + Spindle Fibres', detail: 'Do not omit asters: NCERT defines mitotic apparatus specifically as "The two asters together with spindle fibres".', sourceLineId: 'ch10-10-2-1-list-l2', ncertPage: 122 },
  { id: 'ch10-v-trap-7', category: 'word_traps', prompt: 'G₀ Cells Are Still METABOLICALLY ACTIVE', detail: 'G₀ is called the "inactive" / quiescent stage ONLY with respect to proliferation — cells remain METABOLICALLY ACTIVE.', sourceLineId: 'ch10-10-1-1-p6-l3', ncertPage: 122 },
  { id: 'ch10-v-trap-8', category: 'word_traps', prompt: 'Recombination Completed by END of Pachytene', detail: 'Crossing over occurs during Pachytene and recombination is COMPLETED by the end of Pachytene — Diplotene only reveals chiasmata as the synaptonemal complex dissolves.', sourceLineId: 'ch10-10-4-1-p2-l15', ncertPage: 126 },
];

export const chapter10: ChapterData = {
  id: 'ch10',
  chapterNumber: 10,
  unitTitle: 'Unit 3 · Cell: Structure and Functions',
  className: 'Class 11 NCERT Biology',
  title: 'Cell Cycle and Cell Division',
  pdfFile: 'b11celldiv.pdf',
  pdfPageCount: 11,
  ncertPageRange: [120, 130],
  edition: 'Reprint 2026–27',
  sections,
  diagrams,
  vault,
};
