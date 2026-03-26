const express = require('express');
const Subject = require('../models/Subject');
const Question = require('../models/Question');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// GET /api/subjects - Get all subjects (optionally filter by branch)
router.get('/', async (req, res) => {
  try {
    const { branch } = req.query;
    let filter = { isActive: true };
    if (branch) {
      filter.$or = [{ branch }, { isCommon: true }];
    }
    const subjects = await Subject.find(filter).sort({ isCommon: -1, name: 1 });
    res.json({ subjects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/subjects/:id
router.get('/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json({ subject });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/subjects - Create subject (Admin)
router.post('/', adminAuth, async (req, res) => {
  try {
    const subject = new Subject(req.body);
    await subject.save();
    res.status(201).json({ subject });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/subjects/:id - Update subject (Admin)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json({ subject });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/subjects/:id - Delete subject (Admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/subjects/seed - Seed default ECET subjects (Admin)
router.post('/seed', adminAuth, async (req, res) => {
  try {
    const defaultSubjects = [
      {
        name: 'Mathematics', code: 'MATH', branch: 'COMMON', isCommon: true, icon: '📐', color: '#FF6B6B',
        description: 'Engineering Mathematics - Matrices, Trigonometry, Calculus, DE, Laplace',
        units: [
          { unitNumber: 1, name: 'Matrices & Determinants', topics: ['Types of Matrices', 'Determinants', 'Inverse', 'Rank', 'Cramer Rule'] },
          { unitNumber: 2, name: 'Trigonometry', topics: ['Ratios', 'Properties of Triangles', 'Inverse Trig', 'Hyperbolic Functions'] },
          { unitNumber: 3, name: 'Analytical Geometry', topics: ['Straight Lines', 'Circles', 'Conics', 'Parabola', 'Ellipse'] },
          { unitNumber: 4, name: 'Differentiation', topics: ['Limits', 'Derivatives', 'Chain Rule', 'Applications', 'Maxima Minima'] },
          { unitNumber: 5, name: 'Integration', topics: ['Indefinite', 'Definite', 'Areas', 'Volumes', 'Methods'] },
          { unitNumber: 6, name: 'Differential Equations', topics: ['ODE', 'First Order', 'Linear', 'Exact', 'Applications'] },
          { unitNumber: 7, name: 'Laplace Transforms', topics: ['Definition', 'Properties', 'Inverse', 'Applications'] },
          { unitNumber: 8, name: 'Probability & Statistics', topics: ['Probability', 'Distributions', 'Mean', 'Variance', 'Correlation'] }
        ]
      },
      {
        name: 'Physics', code: 'PHY', branch: 'COMMON', isCommon: true, icon: '⚛️', color: '#4ECDC4',
        description: 'Engineering Physics - Units, Mechanics, Waves, Thermodynamics, Modern Physics',
        units: [
          { unitNumber: 1, name: 'Units & Dimensions', topics: ['SI Units', 'Dimensional Analysis', 'Errors'] },
          { unitNumber: 2, name: 'Vectors & Kinematics', topics: ['Vector Operations', 'Motion', 'Projectile', 'Circular Motion'] },
          { unitNumber: 3, name: 'Work Power Energy', topics: ['Work-Energy Theorem', 'Conservation', 'Collisions'] },
          { unitNumber: 4, name: 'Waves & Sound', topics: ['SHM', 'Wave Motion', 'Sound', 'Doppler Effect'] },
          { unitNumber: 5, name: 'Heat & Thermodynamics', topics: ['Temperature', 'Laws', 'Heat Transfer', 'Entropy'] },
          { unitNumber: 6, name: 'Modern Physics', topics: ['Photoelectric Effect', 'Atomic Models', 'Nuclear Physics', 'X-Rays'] }
        ]
      },
      {
        name: 'Chemistry', code: 'CHEM', branch: 'COMMON', isCommon: true, icon: '🧪', color: '#45B7D1',
        description: 'Engineering Chemistry - Atomic Structure, Solutions, Electrochemistry, Polymers',
        units: [
          { unitNumber: 1, name: 'Atomic Structure & Bonding', topics: ['Atomic Models', 'Quantum Numbers', 'Chemical Bonding'] },
          { unitNumber: 2, name: 'Solutions & Acids Bases', topics: ['Concentration', 'pH', 'Buffers', 'Indicators'] },
          { unitNumber: 3, name: 'Electrochemistry', topics: ['Cells', 'EMF', 'Electrolysis', 'Batteries'] },
          { unitNumber: 4, name: 'Corrosion', topics: ['Types', 'Mechanisms', 'Prevention', 'Coatings'] },
          { unitNumber: 5, name: 'Water Technology', topics: ['Hardness', 'Treatment', 'Purification', 'Desalination'] },
          { unitNumber: 6, name: 'Polymers & Fuels', topics: ['Types', 'Polymerization', 'Fuels', 'Calorific Value'] }
        ]
      },
      {
        name: 'Computer Science', code: 'CSE', branch: 'CSE', isCommon: false, icon: '💻', color: '#6C63FF',
        description: 'CSE - Digital Electronics, Microprocessors, DS, C, DBMS, OS, Networks, OOP',
        units: [
          { unitNumber: 1, name: 'Digital Electronics', topics: ['Number Systems', 'Logic Gates', 'Boolean Algebra', 'Flip-Flops', 'Counters'] },
          { unitNumber: 2, name: 'Microprocessors', topics: ['8085', '8086', 'Architecture', 'Instructions', 'Interfacing'] },
          { unitNumber: 3, name: 'C & Data Structures', topics: ['C Programming', 'Arrays', 'Linked Lists', 'Stacks', 'Queues', 'Trees', 'Sorting'] },
          { unitNumber: 4, name: 'Computer Networks', topics: ['OSI Model', 'TCP/IP', 'Protocols', 'Topologies', 'Routing'] },
          { unitNumber: 5, name: 'Operating Systems', topics: ['Process Management', 'Memory', 'File Systems', 'Scheduling', 'Deadlocks'] },
          { unitNumber: 6, name: 'DBMS', topics: ['ER Model', 'Normalization', 'SQL', 'Transactions', 'Indexing'] },
          { unitNumber: 7, name: 'OOP with C++', topics: ['Classes', 'Inheritance', 'Polymorphism', 'Templates', 'STL'] },
          { unitNumber: 8, name: 'Computer Organization', topics: ['CPU', 'Memory', 'I/O', 'Pipeline', 'Cache'] }
        ]
      },
      {
        name: 'Electronics & Communication', code: 'ECE', branch: 'ECE', isCommon: false, icon: '📡', color: '#FF9F43',
        description: 'ECE - Electronic Devices, Analog & Digital Circuits, Communications, Signals',
        units: [
          { unitNumber: 1, name: 'Electronic Devices', topics: ['Diodes', 'BJT', 'FET', 'MOSFET', 'Biasing'] },
          { unitNumber: 2, name: 'Analog Circuits', topics: ['Amplifiers', 'Op-Amps', 'Oscillators', 'Feedback'] },
          { unitNumber: 3, name: 'Digital Electronics', topics: ['Logic Gates', 'Combinational', 'Sequential', 'ADC/DAC'] },
          { unitNumber: 4, name: 'Signals & Systems', topics: ['Signals', 'LTI Systems', 'Fourier', 'Laplace', 'Z-Transform'] },
          { unitNumber: 5, name: 'Communication Systems', topics: ['AM', 'FM', 'Digital Communication', 'Modulation'] },
          { unitNumber: 6, name: 'Microprocessors', topics: ['8085', '8086', 'Architecture', 'Programming', 'Interfacing'] }
        ]
      },
      {
        name: 'Electrical & Electronics', code: 'EEE', branch: 'EEE', isCommon: false, icon: '⚡', color: '#FECA57',
        description: 'EEE - Circuits, Machines, Power Systems, Control Systems, Electronics',
        units: [
          { unitNumber: 1, name: 'Circuit Theory', topics: ['KVL', 'KCL', 'Network Theorems', 'AC Circuits', 'Resonance'] },
          { unitNumber: 2, name: 'Electrical Machines', topics: ['Transformers', 'DC Machines', 'Induction Motors', 'Synchronous Machines'] },
          { unitNumber: 3, name: 'Power Systems', topics: ['Generation', 'Transmission', 'Distribution', 'Protection'] },
          { unitNumber: 4, name: 'Control Systems', topics: ['Transfer Function', 'Stability', 'Root Locus', 'Bode Plot'] },
          { unitNumber: 5, name: 'Power Electronics', topics: ['SCR', 'Rectifiers', 'Inverters', 'Choppers', 'Converters'] },
          { unitNumber: 6, name: 'Measurements', topics: ['Instruments', 'Bridges', 'Transducers', 'CRO'] }
        ]
      },
      {
        name: 'Mechanical Engineering', code: 'MECH', branch: 'MECH', isCommon: false, icon: '⚙️', color: '#48DBFB',
        description: 'MECH - Mechanics, Thermodynamics, Fluid Mechanics, Manufacturing, Machines',
        units: [
          { unitNumber: 1, name: 'Engineering Mechanics', topics: ['Forces', 'Equilibrium', 'Friction', 'Center of Gravity'] },
          { unitNumber: 2, name: 'Strength of Materials', topics: ['Stress', 'Strain', 'Beams', 'Columns', 'Torsion'] },
          { unitNumber: 3, name: 'Thermodynamics', topics: ['Laws', 'Cycles', 'Entropy', 'Gas Laws', 'Steam'] },
          { unitNumber: 4, name: 'Fluid Mechanics', topics: ['Properties', 'Flow', 'Bernoulli', 'Viscosity', 'Turbines'] },
          { unitNumber: 5, name: 'Manufacturing', topics: ['Casting', 'Welding', 'Machining', 'CNC', 'Metrology'] },
          { unitNumber: 6, name: 'Theory of Machines', topics: ['Mechanisms', 'Gears', 'Cams', 'Governors', 'Vibrations'] }
        ]
      },
      {
        name: 'Civil Engineering', code: 'CIVIL', branch: 'CIVIL', isCommon: false, icon: '🏗️', color: '#FF6348',
        description: 'CIVIL - Surveying, Structures, Concrete, Soil Mechanics, Hydraulics',
        units: [
          { unitNumber: 1, name: 'Surveying', topics: ['Chain', 'Compass', 'Leveling', 'Theodolite', 'Contouring'] },
          { unitNumber: 2, name: 'Building Materials', topics: ['Cement', 'Concrete', 'Steel', 'Timber', 'Bricks'] },
          { unitNumber: 3, name: 'Structural Analysis', topics: ['Beams', 'Trusses', 'Frames', 'Deflection'] },
          { unitNumber: 4, name: 'Soil Mechanics', topics: ['Properties', 'Classification', 'Permeability', 'Consolidation'] },
          { unitNumber: 5, name: 'Hydraulics', topics: ['Flow', 'Channels', 'Pipes', 'Turbines', 'Pumps'] },
          { unitNumber: 6, name: 'Transportation', topics: ['Highway', 'Railway', 'Airport', 'Traffic Engineering'] }
        ]
      }
    ];

    await Subject.deleteMany({});
    const subjects = await Subject.insertMany(defaultSubjects);
    res.status(201).json({ message: `Seeded ${subjects.length} subjects`, subjects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
