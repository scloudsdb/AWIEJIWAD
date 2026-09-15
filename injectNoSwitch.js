const fs = require('fs');
const path = 'apps/clicker-generator/src/geometry/buildClicker.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /const capFp: Section = grow\(plate, tol\); \/\/ cap slips in with `tol`/;

const replacement = `const capFp: Section = grow(plate, tol); // cap slips in with \`tol\`

  if (params.noSwitch) {
    const parts: ClickerPart[] = [];
    const bodyRgb: RGB = params.bodyColorRgb ?? [240, 240, 240];
    
    // Total thickness is backing + image depth
    const imageDepth = Math.max(0.2, params.imageDepth);
    const backing = Math.max(1.0, params.topThickness);
    const slabTopZ = backing + imageDepth;
    
    // The photo keychain is just a solid plate, surrounded by the bezel if border > 0
    let bodyFootprint = plate;
    if (params.borderWidth > 0.05) {
      bodyFootprint = track(plate.offset(params.borderWidth, 'Round', 2.0, 32));
    }
    
    // Build solid block up to the backing height
    let solidBody = extrudeAt(bodyFootprint, backing, 0);
    
    // Build bezel border up to full height
    if (params.borderWidth > 0.05) {
      const borderFp = track(bodyFootprint.subtract(plate));
      const borderSolid = extrudeAt(borderFp, imageDepth, backing);
      solidBody = track(solidBody.add(borderSolid));
    }
    
    // Apply edges
    solidBody = applyEdges(solidBody, params.edgeSettings, bodyFootprint, 0, slabTopZ, backing);
    
    // Keychain loop
    const kc = params.keychain;
    if (kc && kc.enabled) {
      const holeR = Math.max(1.5, (kc.holeDiameterMm ?? 5.2) / 2);
      const th = Math.max(2.5, Math.min(4.0, slabTopZ * 0.5));
      const { p, dir } = edgePointAt(bodyFootprint, kc.angleDeg ?? 90);
      const tangent = [-dir[1], dir[0]];
      const px = p[0] + tangent[0] * (kc.offsetMm ?? 0);
      const py = p[1] + tangent[1] * (kc.offsetMm ?? 0);
      
      const bodyEdge = params.edgeSettings?.find(
        (s) => (s.target === 'clickerBase' || s.target === 'baseTop') && s.style !== 'none' && s.radius >= 0.05,
      );
      const bevelAddon = (s: Solid, fp: Section, t: number, b: number): Solid => {
        if (!bodyEdge) return s;
        const r = Math.min(bodyEdge.radius, (t - b) * 0.45, 2.5);
        if (r < 0.05) return s;
        const topBlock = createEdgeBevelBlock(fp, r, bodyEdge.style, t, false);
        const botBlock = createEdgeBevelBlock(fp, r, bodyEdge.style, b, true);
        return track(track(s.subtract(topBlock)).subtract(botBlock));
      };
      
      const loopOuter = track(CrossSection.circle(holeR + 2.5, 32).translate([px, py]));
      const loopSolid = bevelAddon(extrudeAt(loopOuter, th, 0), loopOuter, th, 0);
      solidBody = track(solidBody.add(loopSolid));
      
      const kcBridge = track(
        CrossSection.square([holeR * 3, holeR * 2 + 5], true).translate([
          p[0] - dir[0] * holeR * 1.5,
          p[1] - dir[1] * holeR * 1.5,
        ]),
      );
      const bridgeSolid = extrudeAt(kcBridge, th, 0);
      solidBody = track(solidBody.add(bridgeSolid));
      
      const loopHole = track(CrossSection.circle(holeR, 32).translate([px, py]));
      const holePrism = extrudeAt(loopHole, slabTopZ + 1, -1);
      solidBody = track(solidBody.subtract(holePrism));
    }
    
    parts.push(toPart(solidBody, 'body', 'base', bodyRgb, 'base-body'));
    
    // Colored regions
    const actualLogoScale = 1.0;
    const logoCX = 0;
    const logoCY = 0;
    let imageArea = plate;
    for (let i = 0; i < regions.length; i++) {
      const r = regions[i];
      if (!r.rings || r.rings.length === 0 || r.rings[0].length === 0) continue;
      let rCS = keep(new CrossSection(r.rings, 'NonZero'));
      rCS = keep(rCS.translate([-logoCX, -logoCY]));
      rCS = keep(rCS.scale([actualLogoScale, actualLogoScale]));
      
      rCS = keep(rCS.intersect(imageArea));
      if (params.colorBleed > 0.001) rCS = keep(rCS.offset(params.colorBleed, 'Round', 0.1));
      if (sectionIsEmpty(rCS)) continue;
      
      const rZ = backing;
      const rDepth = imageDepth;
      
      let partH = rDepth;
      if (params.extrudeChamfer) {
        partH = Math.max(0, partH - 0.25);
        if (partH > 0.1) rCS = keep(rCS.offset(-0.01));
      }
      
      const placed = keep(bevelExtrude(rCS, partH, params.extrudeChamfer ? 0.3 : 0, keep).translate([0, 0, rZ]));
      parts.push({
        name: r.partName || \`top-color-\${i}-0\`,
        ...getMeshData(placed),
        colorRgb: r.filamentRgb || [255, 255, 255],
        kind: 'cap',
        group: 'top',
        numProp: 3,
      });
      imageArea = keep(imageArea.subtract(rCS));
    }
    
    return { parts, switchPlacements: [], warnings };
  }`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content);
console.log('Injected Photo Keychain logic into buildClicker.ts');
