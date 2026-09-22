import jsPDF from "jspdf";
import { montoALetras } from "./numeroALetras";

export const CODIGO_DOC = "MSL-COA0030-20062023";
export const ARRENDADOR = {
  nombre: "Maquinaria Soporte y Logística S.A. de C.V.",
  domicilio: "Calle Paseo del Real Sm 313, Mza 103, Lote 14; 77533 Cancún, Quintana Roo.",
  telefono: "998 842 1332"
};

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const B = "____________";

const fecha = (f) => {
  if (!f) return null;
  const d = new Date(f + "T00:00:00");
  return { dia: d.getDate(), mes: MESES[d.getMonth()], anio: d.getFullYear() };
};
const fLarga = (f) => {
  const d = fecha(f);
  return d ? `${d.dia} de ${d.mes} de ${d.anio}` : `____ de __________ de ____`;
};
const v = (x, relleno = B) => (x && String(x).trim() ? String(x).trim() : relleno);
export const usd = (n) =>
  n === "" || n === null || n === undefined || isNaN(Number(n))
    ? "$ ____________"
    : "$ " + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const mxn = usd;

/**
 * Modelo del documento: lista de bloques. El mismo modelo alimenta
 * la vista previa en pantalla y el PDF, así no se desfasan.
 * Tipos: title, p, h, box {titulo, filas}, grid {cols:[{titulo,texto}]},
 *        firmas {izq, der}, salto, espacio
 */
export function construirDocumento(d) {
  const equipos = (d.equipos || []).length ? d.equipos : [{}];
  const rep = v(d.representanteMaqsol, "Lic. Francisco Torres Morales");
  const f = fecha(d.fechaContrato);
  const fechaFirma = f
    ? `a los ${f.dia} días del mes de ${f.mes} del año ${f.anio}`
    : "a los ____ días del mes de __________ del año ____";
  const clienteNombre = v(d.razonSocial, "______________________");
  const repCliente = v(d.representante, "______________________");
  const vence = fecha(d.pagareVence);
  const venceTxt = vence ? `el día ${vence.dia} del mes de ${vence.mes} del año ${vence.anio}` : "el día ____ del mes de __________ del año ____";
  const pagareFecha = fecha(d.fechaContrato);

  const b = [];

  b.push({ t: "title", text: "CONTRATO DE ARRENDAMIENTO" });
  if (d.folio) b.push({ t: "center", text: "Folio: " + d.folio });
  b.push({
    t: "p",
    text: `Contrato de Arrendamiento de Maquinaria (en lo sucesivo referido como el “Contrato”) que celebran por una parte Maquinaria Soporte y Logística, S.A. de C.V. representada en este acto por el C. ${rep.replace(/^(Lic|Ing|C)\.\s*/i, "")}, a quien en lo sucesivo se denominará La Arrendadora y por la otra parte, la sociedad denominada: ${clienteNombre} representada en este acto por el C. ${repCliente} a quien en lo sucesivo se denominará La Arrendataria, y conjuntamente con la Arrendadora se les denominará como Las Partes, de conformidad con las declaraciones y cláusulas siguientes:`
  });

  b.push({
    t: "box",
    titulo: "EL ARRENDADOR",
    filas: [
      ["NOMBRE:", ARRENDADOR.nombre],
      ["DOMICILIO:", ARRENDADOR.domicilio],
      ["TELÉFONO:", ARRENDADOR.telefono],
      ["REPRESENTANTE LEGAL:", rep],
      ["PERSONALIDAD:", "Representante Legal"]
    ]
  });
  b.push({
    t: "box",
    titulo: "LA ARRENDATARIA",
    filas: [
      ["NOMBRE:", v(d.razonSocial)],
      ["R.F.C.:", v(d.rfc)],
      ["DOMICILIO:", v(d.domicilio)],
      ["TELÉFONO:", v(d.telefono)],
      ["REPRESENTANTE LEGAL:", v(d.representante)],
      ["PERSONALIDAD:", "Representante Legal"]
    ]
  });

  equipos.forEach((e, i) => {
    b.push({
      t: "box",
      titulo: equipos.length > 1 ? `EQUIPO ARRENDADO ${i + 1}` : "EQUIPO ARRENDADO",
      filas: [
        ["DESCRIPCIÓN DEL EQUIPO:", v(e.descripcion)],
        ["MARCA:", v(e.marca)],
        ["MODELO:", v(e.modelo)],
        ["SERIE:", v(e.serie)],
        ["MOTOR:", v(e.motor)],
        ["VALOR DE RECUPERACIÓN DEL EQUIPO:", `${usd(e.valorUSD)} Dólares Americanos USD.`]
      ]
    });
  });

  b.push({
    t: "grid",
    cols: [
      { titulo: "PERIODO DE RENTA", texto: v(d.periodo) },
      { titulo: "VIGENCIA DEL CONTRATO", texto: `Del ${fLarga(d.fechaInicio)} al ${fLarga(d.fechaFin)}.` },
      { titulo: "LUGAR DE OPERACIÓN", texto: `Obra: ${v(d.obra)}` }
    ]
  });

  b.push({
    t: "box",
    titulo: `IMPORTE DE LA RENTA POR ${v(d.periodo, "EL PERIODO").toUpperCase()}`,
    filas: equipos.map((e) => [v(e.descripcion, "Equipo") + ":", `${mxn(e.importeRenta)} pesos + I.V.A.`])
  });
  b.push({
    t: "box",
    titulo: "TRASLADO DEL EQUIPO INCLUYENDO RETORNO AL TÉRMINO DE LA RENTA",
    filas: [["IMPORTE:", `${mxn(d.traslado)} pesos + I.V.A.`]]
  });

  b.push({
    t: "p",
    text: "FORMA DE PAGO: De contado por anticipado al inicio del periodo de renta, en caso de continuidad de la renta el pago deberá hacerse antes del comienzo del nuevo periodo.",
    bold: true
  });
  b.push({ t: "p", text: "La Arrendataria manifiesta bajo protesta de decir verdad que:" });
  b.push({
    t: "p",
    text: "Los recursos con los que hará frente a sus obligaciones derivadas de este contrato provienen de fuentes lícitas, de conformidad con lo establecido en la Ley Federal de Extinción de Dominio y en los artículos 17 y 18 de la Ley para la Prevención e Identificación de Operaciones con Recursos de Procedencia Ilícita."
  });
  b.push({
    t: "p",
    text: "Es su voluntad tomar en arrendamiento La Maquinaria antes descrita, por requerirla en los trabajos para los que ha sido diseñada, sujetándose al arrendamiento respectivo a los términos y condiciones que aparecen en las siguientes cláusulas:"
  });

  b.push({ t: "h", text: "CLÁUSULAS" });
  const cl = [
    `1.- La Arrendataria, se compromete al pago puntual y oportuno de la renta convenida y de los fletes por traslados de la Maquinaria; los pagos subsecuentes serán también por mensualidades adelantadas en el domicilio del Arrendador. El equipo se considera rentado a partir de que se recoge en las instalaciones del Arrendador y hasta su retorno a las mismas instalaciones.`,
    `Los días y las horas que excedan a la fecha límite de arrendamiento, se cobrarán a razón de lo que resulte dividir el precio de renta entre 21 para los días y entre 160 para las horas.`,
    `La Maquinaria se usará en la obra localizada en ${v(d.obra, "------------------------")}, cerca de la Ciudad de ${v(d.ciudadObra, "---------------")}.`,
    `2.- Por falta de pago por adelantado de una sola de las rentas pactadas, podrá la Arrendadora suspender la operación de la Maquinaria, obtener la devolución de esta y exigir a la Arrendataria el pago de los días que hayan de atraso hasta el día de recolección y retiro de la Maquinaria de las instalaciones o de la obra de la Arrendataria.`,
    `3.- El precio del Arrendamiento ha sido calculado a razón de jornadas de trabajo mínimas, por lo que la Arrendadora no bonificará cantidad alguna en caso de que al término del arrendamiento la Maquinaria hubiera trabajado un número inferior al de las horas convenidas.`,
    `4.- Si después de terminado el plazo del arrendamiento forzoso continúa el arrendamiento sin oposición de la Arrendadora o de la Arrendataria, se entenderá prorrogado el contrato en los mismos términos por tiempo indefinido pudiendo en este caso darlo por terminado cualquiera de Las Partes mediante notificación escrita dada al contratante con 3 días de anticipación.`,
    `5.- Al vencimiento de este contrato, la Arrendataria devolverá la Maquinaria y la pondrá a disposición de la Arrendadora quien la recibirá entregando un documento de recepción con el check list correspondiente, quedando sin efecto el pagaré firmado por la Arrendataria, en caso de no existir ningún daño ocasionado al equipo.`,
    `Por cada día de retraso en la entrega de la Maquinaria, la Arrendataria pagará a la Arrendadora una cantidad equivalente al prorrateo diario de la renta conforme al importe de la renta convenida.`,
    `6.- USO DE LA MAQUINARIA; La Arrendataria, solo podrá usar la MAQUINARIA de acuerdo a las funciones para las que fue fabricada, de acuerdo a su manual de uso y conforme a la naturaleza de la misma. Así mismo, Las Partes convienen que, en virtud de que la MAQUINARIA quedará al cuidado y operación de la Arrendataria y bajo su absoluta responsabilidad, el no uso de la misma por decisión de la Arrendataria, la privación total o parcial del uso y disfrute de la misma por terceros o si llegare a suceder cualquier eventualidad no imputable a la Arrendadora, no será motivo de reducción de la Renta convenida entre Las Partes, salvo que la MAQUINARIA se reporte a la Arrendadora como fuera de servicio por un problema mecánico no imputable a la Arrendataria. En este caso, se repondrá el tiempo proporcional de los días o de las horas que la MAQUINARIA se encuentre fuera de servicio.`,
    `7.- OBLIGACIONES DE LA ARRENDATARIA`,
    `La arrendataria, se obliga a lo siguiente:`,
    `I.- A usar la MAQUINARIA únicamente en los trabajos para los cuales ha sido diseñada y fabricada, así como a usarla en el domicilio descrito en la cláusula primera 3er párrafo de este contrato.`,
    `II.- A llevar a cabo las inspecciones y verificaciones diarias de la MAQUINARIA conforme al Manual de Funcionamiento de la misma, antes del inicio de las actividades u operación de la MAQUINARIA. En el caso de requerir agregar y/o rellenar cualquier compartimiento de lubricación o refrigerante, debe usar los especificados por el fabricante de la MAQUINARIA. Todo lo anterior, será por su cuenta y previamente autorizado por el área técnica del Arrendador.`,
    `III.- A operar y mantener la MAQUINARIA con personal capacitado técnicamente para ello.`,
    `IV.- A no subarrendar, ni gravar, ni dar en garantía física ni jurídica la MAQUINARIA.`,
    `V.- A aceptar a su cargo los costos de operación, cualquiera que sea su naturaleza, incluyendo las partes reconocidas como accesorios como lo pueden ser torretas, luces de trabajo, pernos, bujes, deslizantes y cualquier otra herramienta básica e indispensable en caso de que cuente con ellas.`,
    `VI.- A asumir la responsabilidad por faltantes y daños ocasionados a la estructura de la máquina, como hojalatería, sistema de luces, tolvas, loderas y en general a la apariencia física de la MAQUINARIA. Asimismo es responsable por el abuso en la operación de la MAQUINARIA y/o negligencia de su personal, vandalismo, actos de la naturaleza, caso fortuito y fuerza mayor. Todos los faltantes y daños causados a la MAQUINARIA, serán con cargo a la Arrendataria.`,
    `VII.- A avisar a La Arrendadora de inmediato de cualquier falla o descompostura de la MAQUINARIA. Ningún trabajo de reparación de la MAQUINARIA podrá ser realizado por personas ajenas a la Arrendadora aún cuando se consideren como menores o leves. Cualquier daño que esto ocasione a la MAQUINARIA en contravención de lo anterior, será por cuenta de la Arrendataria.`,
    `8.- La Arrendataria se obliga bajo su exclusiva responsabilidad, a que la Maquinaria será operada en todo momento solo por personal autorizado, debidamente capacitado y con adecuada experiencia para ello. La Arrendataria se obliga y es responsable, incluyendo por parte de los operadores de la Maquinaria, del cumplimiento de todas las disposiciones legales aplicables (inclusive conforme a las especificaciones del fabricante) para el debido uso de la Maquinaria.`,
    `9.- La Arrendataria se hace responsable de la Maquinaria materia de este contrato, desde el momento en que salga de nuestras instalaciones, hasta su retorno al finalizar el periodo de renta o los trabajos para los cuales contrataron la renta de la Maquinaria, por lo que deberá proporcionar un lugar seguro para el resguardo de la Maquinaria en los tiempos de descanso o días de asueto.`,
    `10.- La Arrendataria solo podrá utilizar la Maquinaria arrendada en trabajos que sean adecuados y propios a los de su especificación y para los fines que está específicamente diseñada y no podrá trasladarla ni usarla en otro sitio distinto al estipulado en este contrato sin conocimiento y autorización previa de la Arrendadora.`,
    `11.- Serán por cuenta de la Arrendataria, el mantenimiento diario de la Maquinaria, incluyendo engrasado, revisión de niveles de líquidos, revisión de presión de llantas, reapriete de tornillos y birlos, limpieza y desincrustar concreto, pasta, pintura y cualquier material que dañe o manche la estructura de la Maquinaria, así como la reparación de llantas por pinchaduras o daños ocasionados durante el trabajo de la Maquinaria.`,
    `12.- Queda expresamente pactado que desde el momento en que la Arrendataria tome posesión de la Maquinaria arrendada, serán a su cargo cualquier pérdida o deterioro fuera del uso normal que sufra la Maquinaria, excepto los que estén cubiertos por el seguro de la Arrendadora, siendo por cuenta de la Arrendataria, el pago del deducible de dicho seguro en caso de llegar a hacer la reclamación a la compañía aseguradora y, siempre y cuando dicha reclamación proceda.`,
    `13.- La Maquinaria se encuentra asegurada (por daños materiales), pero en caso de siniestro, el pago del deducible corre por cuenta de la Arrendataria, así como los gastos extraordinarios e indemnizaciones correspondientes. Los gastos extraordinarios en que se incurra y sean pagados por la Arrendadora, deberán ser reembolsados de forma inmediata por la Arrendataria una vez que le sea presentado el estado de cuenta correspondiente.`,
    `14.- La Arrendataria no podrá traspasar en todo ni en parte la Maquinaria materia de este contrato, ni gravar o enajenar en ninguna forma los derechos que le corresponden por méritos de este contrato.`,
    `15.- En caso de que la Maquinaria arrendada fuera objeto de algún aseguramiento, retención, secuestro o embargo de cualquier especie, la Arrendataria hará del conocimiento inmediato de estos hechos a la Arrendadora para que ésta tome las providencias pertinentes a la defensa de sus derechos, debiendo la Arrendataria cubrir por exclusiva cuenta los gastos, honorarios, costos y desembolsos de cualquier género que tuvieran que hacerse para que la Maquinaria sea devuelta a la Arrendadora, debiendo también cubrir el importe de las rentas que se causen hasta que la Maquinaria sea puesta a disposición de la Arrendadora.`,
    `16.- Además de quedar sujeto a las causas de rescisión establecidas por la ley, este contrato se podrá rescindir:`,
    `a) Por no cubrirse la renta en la forma y términos establecidos.`,
    `b) Por no comunicar a la Arrendadora el lugar exacto en donde está trabajando la Maquinaria arrendada.`,
    `c) Por destinar la Maquinaria a trabajos diferentes de aquellos para lo que ha sido específicamente diseñada y para lo que fue contratada.`,
    `d) Por no comunicar a la Arrendadora cualquier toma de posesión que de dicha Maquinaria efectúe cualquier autoridad judicial o administrativa o cualquier otra persona.`,
    `e) En general por cualquier incumplimiento en que incurra alguna de Las Partes a las estipulaciones de este contrato.`,
    `17.- La Arrendataria se obliga a no quitar, alterar o cubrir números, series o marcas que lleven puesto o grabadas la Maquinaria contratada, ni tampoco a pintarlos de un color distinto al original o con rótulos o letreros ajenos a los usados por la Arrendadora.`,
    `18.- La Arrendataria autoriza desde ahora y con carácter de irrevocable a la Arrendadora o a sus representantes a tener libre acceso a lugares y locales donde se encuentra la Maquinaria arrendada durante todo el tiempo que dure el arrendamiento, con el fin de que pueda llevar a cabo sus labores de supervisión y administración del arrendamiento, bajo su propio riesgo.`,
    `19.- La Arrendataria concede desde ahora a la Arrendadora o quien represente sus derechos, la facultad irrevocable de tomar posesión de la Maquinaria donde quiera que se encuentren al rescindirse este contrato por cualquiera de las causas que se mencionan en el clausulado de este documento.`,
    `20.- Para cualquier controversia que pudiera suscitarse con motivo de la interpretación, cumplimiento o rescisión de este contrato, Las Partes se someten expresamente a los tribunales competentes en la Ciudad de Cancún, Quintana Roo.`
  ];
  cl.forEach((text) => b.push({ t: "p", text }));

  if (d.adicionales && d.adicionales.trim()) {
    b.push({ t: "p", text: "21.- " + d.adicionales.trim() });
  }

  b.push({ t: "p", text: `Este contrato se firma por duplicado en la ciudad de Cancún, Quintana Roo ${fechaFirma}.`, keep: true });
  b.push({
    t: "firmas",
    izq: ["MAQUINARIA SOPORTE Y LOGISTICA, SA DE CV", `LIC. ${rep.replace(/^Lic\.\s*/i, "").toUpperCase()}`, "REPRESENTANTE LEGAL"],
    der: [clienteNombre.toUpperCase(), `C. ${repCliente.toUpperCase()}`, "REPRESENTANTE LEGAL"]
  });

  // ---------- PAGARÉ ----------
  b.push({ t: "salto" });
  b.push({ t: "title", text: "PAGARÉ" });
  b.push({
    t: "p",
    text: `Cancún, Quintana Roo, a ${pagareFecha ? `${pagareFecha.dia} de ${pagareFecha.mes} de ${pagareFecha.anio}` : "____ de ____________ de ____"}.`
  });
  b.push({ t: "p", text: `BUENO POR ${usd(d.pagareMonto)} U.S.D.`, bold: true });
  b.push({ t: "p", text: "PAGARÉ 1/1", bold: true });
  b.push({
    t: "p",
    text: `Debo (emos) y pagaré (mos) incondicionalmente a la orden de MAQUINARIA SOPORTE Y LOGISTICA, S.A. de C.V., en la Ciudad de Cancún, Quintana Roo o en cualquier otra plaza que se me (nos) requiera el pago a elección de la beneficiaria, la cantidad de ${usd(d.pagareMonto)} (${d.pagareMonto ? montoALetras(d.pagareMonto) : "____________________, 00/100 U.S.C.Y."}) ${venceTxt}.`
  });
  b.push({
    t: "p",
    text: `La falta de pago oportuno causará un interés moratorio a la tasa del 5% mensual sobre el saldo insoluto durante todo el tiempo que dure la mora, mismo que se computará a partir del día siguiente a la fecha de vencimiento de este documento, que lo es precisamente ${venceTxt} y da lugar al vencimiento anticipado de todo lo que le siga en número.`
  });
  b.push({
    t: "p",
    text: "El suscriptor y el aval aceptan, que todos los pagos parciales o a cuenta serán aplicados primeramente al pago de intereses moratorios, al pago de intereses ordinarios y finalmente serán aplicados a la suerte principal."
  });
  b.push({
    t: "box",
    titulo: "SUSCRIPTOR",
    filas: [
      ["NOMBRE:", v(d.razonSocial)],
      ["R.F.C.:", v(d.rfc)],
      ["DOMICILIO:", v(d.domicilio)],
      ["TELÉFONO:", v(d.telefono)],
      ["REPRESENTANTE LEGAL:", "C. " + v(d.representante)],
      ["CURP:", v(d.curpRepresentante)]
    ]
  });
  b.push({ t: "linea", text: "FIRMA" });
  b.push({
    t: "box",
    titulo: "AVAL",
    filas: [
      ["NOMBRE:", v(d.avalNombre)],
      ["CURP:", v(d.avalCurp)]
    ]
  });
  b.push({ t: "linea", text: "FIRMA" });

  // ---------- CARTA DE DEPOSITARIO ----------
  b.push({ t: "salto" });
  b.push({ t: "title", text: "CARTA DE DEPOSITARIO" });
  b.push({
    t: "box",
    titulo: "DEPOSITARIO DE LA MAQUINARIA",
    filas: [
      ["NOMBRE:", v(d.depositarioNombre, v(d.razonSocial))],
      ["REPRESENTANTE LEGAL:", v(d.depositarioRepresentante, v(d.representante))],
      ["DOMICILIO:", v(d.depositarioDomicilio, v(d.domicilio))],
      ["DESCRIPCIÓN DE LA MAQUINARIA:", equipos.map((e) => [e.descripcion, e.marca, e.modelo, e.serie ? "serie " + e.serie : ""].filter(Boolean).join(" ")).filter(Boolean).join("; ") || B],
      ["UBICACIÓN DONDE SE ENTREGARÁ:", v(d.obra)]
    ]
  });
  b.push({
    t: "p",
    text: "EL DEPOSITARIO, por su propio y personal derecho, se constituye a partir de la firma de este CONTRATO y sus anexos, para todos los efectos legales correspondientes, en depositario de la MAQUINARIA que se otorga en arrendamiento por la ARRENDADORA, y que se precisan en el cuerpo de este contrato, obligándose a conservarlos sin demérito o deterioro que reduzca o menoscabe su valor, distinto de los que correspondan a su uso ordinario, obligándose a entregarlos a la ARRENDADORA o, a la persona que ésta designe como nuevo depositario, en cualquier momento mediante simple comunicación por escrito, en el entendido que al negarse a entregarlo comete el delito de Abuso de Confianza."
  });
  b.push({
    t: "p",
    text: "Para los efectos del presente, EL DEPOSITARIO acepta el cargo aquí conferido y promete, bajo formal protesta de decir verdad, desempeñarlo bien y fielmente."
  });
  b.push({
    t: "p",
    text: `Anexo que se suscribe por EL DEPOSITARIO y que forma parte integrante del “CONTRATO DE ARRENDAMIENTO” suscrito entre la ARRENDADORA MAQUINARIA SOPORTE Y LOGISTICA, SA DE CV, y EL ARRENDATARIO ${clienteNombre}, el OBLIGADO SOLIDARIO y AVAL: ${v(d.avalNombre, "______________________")} y el DEPOSITARIO: ${v(d.depositarioRepresentante, repCliente)} en su calidad de representante legal de la persona Moral.`
  });
  b.push({
    t: "p",
    text: `Suscrito en el Municipio de Benito Juárez, Cancún, Estado de Quintana Roo, México; con fecha ${f ? `${f.dia} del mes de ${f.mes} del año ${f.anio}` : "____ del mes de __________ del año ____"}.`
  });
  b.push({
    t: "firmas",
    izq: ["EL DEPOSITARIO", `FIRMA: ${v(d.depositarioRepresentante, repCliente)}`, `INE: ${v(d.depositarioIne)}`, `CURP: ${v(d.depositarioCurp, v(d.curpRepresentante))}`, "Por su propio y personal derecho"],
    der: ["AVAL SOLIDARIO", `FIRMA: ${v(d.avalNombre, "______________________")}`, `INE: ${v(d.avalIne)}`, `CURP: ${v(d.avalCurp)}`, "Por su propio y personal derecho"]
  });

  return b;
}

/** Genera y descarga el PDF a partir del modelo. */
export function descargarContratoPDF(bloques, nombreArchivo, logoUrl) {
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const W = 216, H = 279, M = 18, ancho = W - M * 2;
  let y = 0;
  let pagina = 1;
  const AZUL = [29, 92, 143];

  const cabecera = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(70, 70, 70);
    doc.text("MAQUINARIA SOPORTE Y LOGISTICA SA DE CV", M, 12);
    doc.text("pág. " + pagina, W - M, 12, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(CODIGO_DOC, M, 16);
    if (logoUrl) {
      try { doc.addImage(logoUrl, "PNG", W - M - 22, 4, 22, 11); } catch { /* sin logo */ }
    }
    doc.setDrawColor(...AZUL);
    doc.setLineWidth(0.5);
    doc.line(M, 18, W - M, 18);
    y = 25;
  };
  const nuevaPagina = () => { doc.addPage(); pagina += 1; cabecera(); };
  const asegura = (alto) => { if (y + alto > H - 16) nuevaPagina(); };
  const texto = (tam, negrita, color = [25, 25, 25]) => {
    doc.setFont("helvetica", negrita ? "bold" : "normal");
    doc.setFontSize(tam);
    doc.setTextColor(...color);
  };
  const lh = (tam) => tam * 0.46;

  cabecera();

  bloques.forEach((bl) => {
    if (bl.t === "salto") { nuevaPagina(); return; }

    if (bl.t === "title") {
      asegura(14);
      texto(14, true);
      doc.text(bl.text, W / 2, y + 4, { align: "center" });
      y += 11;
      return;
    }
    if (bl.t === "center") {
      texto(9, false, [90, 90, 90]);
      doc.text(bl.text, W / 2, y, { align: "center" });
      y += 6;
      return;
    }
    if (bl.t === "h") {
      asegura(10);
      texto(11, true);
      doc.text(bl.text, W / 2, y + 3, { align: "center" });
      y += 9;
      return;
    }
    if (bl.t === "p") {
      const tam = 9.5;
      texto(tam, !!bl.bold);
      const lineas = doc.splitTextToSize(bl.text, ancho);
      if (bl.keep) asegura(lineas.length * (lh(tam) + 0.7) + 46);
      lineas.forEach((ln) => {
        asegura(lh(tam) + 0.6);
        doc.text(ln, M, y + 3);
        y += lh(tam) + 0.7;
      });
      y += 2.4;
      return;
    }
    if (bl.t === "box") {
      const tam = 8.8;
      const anchoEtq = 58;
      const anchoVal = ancho - anchoEtq - 4;
      texto(tam, false);
      const filas = bl.filas.map(([e, val]) => {
        doc.setFont("helvetica", "bold");
        const le = doc.splitTextToSize(e, anchoEtq - 2);
        doc.setFont("helvetica", "normal");
        const lv = doc.splitTextToSize(String(val), anchoVal);
        return { le, lv, n: Math.max(le.length, lv.length) };
      });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      const lt = doc.splitTextToSize(bl.titulo, ancho - 4);
      const altoTitulo = lt.length * lh(9) + 3.2;
      const altoFilas = filas.reduce((s, f) => s + f.n * lh(tam) + 1.8, 0) + 1.5;
      asegura(altoTitulo + Math.min(altoFilas, 40));

      doc.setFillColor(...AZUL);
      doc.rect(M, y, ancho, altoTitulo, "F");
      texto(9, true, [255, 255, 255]);
      doc.text(lt, M + 2, y + 4.2);
      y += altoTitulo;

      const inicio = y;
      filas.forEach((f) => {
        const alto = f.n * lh(tam) + 1.8;
        if (y + alto > H - 16) {
          doc.setDrawColor(190);
          doc.rect(M, inicio, ancho, y - inicio);
          nuevaPagina();
        }
        texto(tam, true);
        doc.text(f.le, M + 2, y + 4);
        texto(tam, false);
        doc.text(f.lv, M + anchoEtq + 2, y + 4);
        y += alto;
      });
      doc.setDrawColor(190);
      doc.setLineWidth(0.25);
      doc.rect(M, inicio, ancho, y - inicio + 1.5);
      y += 5.5;
      return;
    }
    if (bl.t === "grid") {
      const n = bl.cols.length;
      const cw = ancho / n;
      texto(8.8, false);
      const cuerpos = bl.cols.map((c) => doc.splitTextToSize(c.texto, cw - 4));
      const nMax = Math.max(...cuerpos.map((c) => c.length));
      const alto = nMax * lh(8.8) + 4;
      asegura(alto + 9);
      bl.cols.forEach((c, i) => {
        doc.setFillColor(...AZUL);
        doc.rect(M + i * cw, y, cw, 7, "F");
        texto(8.5, true, [255, 255, 255]);
        doc.text(c.titulo, M + i * cw + cw / 2, y + 4.7, { align: "center" });
      });
      y += 7;
      doc.setDrawColor(190);
      doc.setLineWidth(0.25);
      bl.cols.forEach((c, i) => {
        doc.rect(M + i * cw, y, cw, alto);
        texto(8.8, false);
        doc.text(cuerpos[i], M + i * cw + 2, y + 4.6);
      });
      y += alto + 5.5;
      return;
    }
    if (bl.t === "linea") {
      asegura(16);
      y += 9;
      doc.setDrawColor(60);
      doc.setLineWidth(0.3);
      doc.line(W - M - 75, y, W - M, y);
      texto(8.5, false);
      doc.text(bl.text, W - M - 37.5, y + 4, { align: "center" });
      y += 8;
      return;
    }
    if (bl.t === "firmas") {
      const alto = 16 + Math.max(bl.izq.length, bl.der.length) * 4.6;
      asegura(alto + 6);
      y += 16;
      doc.setDrawColor(60);
      doc.setLineWidth(0.3);
      doc.line(M, y, M + 78, y);
      doc.line(W - M - 78, y, W - M, y);
      const pinta = (lineas, cx) => {
        lineas.forEach((ln, i) => {
          texto(8.6, i === 0);
          const partes = doc.splitTextToSize(ln, 78);
          doc.text(partes, cx, y + 5 + i * 4.6, { align: "center" });
        });
      };
      pinta(bl.izq, M + 39);
      pinta(bl.der, W - M - 39);
      y += 10 + Math.max(bl.izq.length, bl.der.length) * 4.6;
      return;
    }
  });

  doc.save(nombreArchivo + ".pdf");
}
