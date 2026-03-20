export interface SectionItem {
  id: string;
  numeral: string;
  text: string;
}

export interface SubSection {
  id: string;
  title: string;
  items: SectionItem[];
}

export interface Section {
  id: string;
  title: string;
  subsections: SubSection[];
}

export type DiagnosticType = 'SECRETARIA' | 'INVIMA';

export const SECTIONS_INVIMA: Section[] = [
  {
    id: '1',
    title: '1. EDIFICACIÓN E INSTALACIONES',
    subsections: [
      {
        id: '1.1',
        title: '1. Aspectos a Verificar',
        items: [
          { id: '1.1-1', numeral: '1.1', text: 'El área de proceso se encuentra con adecuada iluminación en calidad e intensidad (natural o artificial) y poseen sistemas antiruptura.' },
          { id: '1.1-2', numeral: '1.2', text: 'Se garantiza que el flujo de aire en el establecimiento no vaya de un área de mayor contaminación a un área de menor contaminación, el establecimiento asegura la salida al exterior de la planta de los olores, gases y vapores desagradables y se evita su acumulación.' },
          { id: '1.1-3', numeral: '1.3', text: 'El establecimiento ubicado cumpliendo con el POT, Plan Básico de ordenamiento territorial o Esquema de ordenamiento territorial (Debe presentar permiso de la autoridad correspondiente).' },
          { id: '1.1-4', numeral: '1.4', text: 'El establecimiento cuenta con áreas independientes que aseguran el desarrollo higiénico de las operaciones, las instalaciones son cerradas y las respectivas construcciones sólidas.' },
          { id: '1.1-5', numeral: '1.5', text: 'La planta cuenta con diseño de flujo unidireccional con accesos separados para ingreso de materias primas y salida de producto terminado. Se mantiene la secuencia lógica del proceso desde la recepción hasta el despacho evitando retrasos indebidos y flujos cruzados.' },
          { id: '1.1-6', numeral: '1.6', text: 'Las instalaciones eléctricas (tomacorrientes e interruptores) y luminarias artificiales se encuentran debidamente protegidas y en buen estado. La planta cuenta con energía eléctrica y un plan de contingencia que garantice el funcionamiento de las áreas y secciones a fin de mantener la inocuidad del producto.' },
          { id: '1.1-7', numeral: '1.7', text: 'En sus alrededores no se encuentran focos de insalubridad o contaminación (basuras, criaderos de animales etc.).' },
          { id: '1.1-8', numeral: '1.8', text: 'Las áreas circundantes de los equipos son de fácil limpieza y desinfección (amplias y de fácil circulación y manipulación).' },
          { id: '1.1-9', numeral: '1.9', text: 'Existe suficiente hermeticidad que impida el acceso de plagas en el área de manipulación: las puertas deben permanecer cerradas y evitar flujos de aire al interior.' },
          { id: '1.1-10', numeral: '1.10', text: 'Las paredes, pisos y techos son de color claro sin grietas, rugosidades y/o asperezas donde se pueda acumular suciedad.' },
          { id: '1.1-11', numeral: '1.11', text: 'Cuenta con drenajes suficientes e inclinaciones y/o haraganes que faciliten la extracción de la humedad, los drenajes cuentan con rejillas en material sanitario.' },
          { id: '1.1-12', numeral: '1.12', text: 'Las paredes están construidas con materiales resistentes y acabados sanitarios con uniones redondeadas entre paredes, entre estas y el piso, y diseñadas y construidas para evitar la acumulación de suciedad y facilitar la limpieza y desinfección. Los techos se encuentran en buen estado.' },
          { id: '1.1-13', numeral: '1.13', text: 'En las áreas de producción de alimentos o cercano a éstas, se cuenta con lavamanos de accionamiento no manual, dotado con dispensadores que contengan jabón desinfectante y toallas desechables.' },
          { id: '1.1-14', numeral: '1.14', text: 'El establecimiento cuenta con una instalación sanitaria que permita la limpieza y desinfección de las manos del personal antes, durante y después del proceso, la misma está dotada con los implementos necesarios (toallas para el secado de manos, dispensador de jabón, aviso alusivo al lavado de manos y accionamiento no manual).' },
          { id: '1.1-15', numeral: '1.15', text: 'Se dispone de servicios sanitarios, dotados de los implementos requeridos para la higiene personal (papel higiénico, dispensador con jabón desinfectante, implementos desechables y papeleras accionamiento no manual), los sanitarios no están ubicados dentro del área de proceso. Existe separación física entre los sanitarios y vestieres.' },
          { id: '1.1-16', numeral: '1.16', text: 'Se dispone de un espacio adecuado para la disposición de los objetos personales y un área adecuada que funcione como vestier.' },
          { id: '1.1-17', numeral: '1.17', text: 'Todas las áreas o secciones se encuentran señalizadas en cuanto a accesos, circulación, servicios, seguridad entre otras y existen avisos alusivos a prácticas higiénicas.' },
          { id: '1.1-18', numeral: '1.18', text: 'En las áreas de proceso se dispone de lavamanos de accionamiento no manual, provisto de sistema de lavado con agua potable, desinfección y secado de manos.' },
          { id: '1.1-19', numeral: '1.19', text: 'Se encuentran filtros sanitarios todas las áreas donde el tránsito del personal puede generar riesgos de contaminación de un área a otra y su diseño y ubicación obligan al personal a hacer uso de éste. Los filtros disponen de sistema de lavado y desinfección de botas ubicado al ingreso de cada área.' }
        ]
      }
    ]
  },
  {
    id: '2',
    title: '2. EQUIPOS Y UTENSILIOS',
    subsections: [
      {
        id: '2.1',
        title: '2. Aspectos a Verificar',
        items: [
          { id: '2.1-1', numeral: '2.1', text: 'Se dispone de equipos de medición adecuados para el control de temperatura, debidamente calibrados y en las escalas requeridas por el proceso.' },
          { id: '2.1-2', numeral: '2.2', text: 'No están en contacto directo con el piso, para lo cual se dispone de estibas o cualquier otro sistema sanitario utilizado para este fin.' },
          { id: '2.1-3', numeral: '2.3', text: 'El producto es conducido desde el exterior hasta el lugar de manipulación, en el interior del establecimiento evitando la contaminación.' },
          { id: '2.1-4', numeral: '2.4', text: 'Los equipos y superficies en contacto con alimentos (incluidas las tuberías de conducción de alimentos si aplica) están fabricados con materiales inertes, no tóxicos, resistentes a la corrosión, no recubiertos con pinturas o materiales desprendibles y son desmontables para garantizar procesos de limpieza y desinfección.' },
          { id: '2.1-5', numeral: '2.5', text: 'Los utensilios y otros elementos utilizados en el proceso productivo y en contacto directo con los alimentos son de material sanitario, se encuentran en buen estado, ordenados y los mismos no presentan corrosión o presencia de hongos.' },
          { id: '2.1-6', numeral: '2.6', text: 'Se cuenta con equipos suficientes para el almacenamiento en refrigeración y congelación evitando la saturación de productos, los mismos deben estar ordenados evitando en todo caso la contaminación cruzada.' },
          { id: '2.1-7', numeral: '2.7', text: 'Los equipos y los aparatos eléctricos funcionan correctamente (no se poseen objetos en desuso).' }
        ]
      }
    ]
  },
  {
    id: '3',
    title: '3. PRÁCTICAS HIGIÉNICAS',
    subsections: [
      {
        id: '3.1',
        title: '3. Aspectos a Verificar',
        items: [
          { id: '3.1-1', numeral: '3.1', text: 'Se evidencia un lavado de manos con la técnica y la frecuencia requerida.' },
          { id: '3.1-2', numeral: '3.2', text: 'El personal manipulador de alimentos no tiene maquillaje, lociones, anillos, pulseras, relojes, joyas y accesorios en general; sus manos se encuentran limpias, las uñas cortas y sin esmalte.' },
          { id: '3.1-3', numeral: '3.3', text: 'El personal manipulador de alimentos evita prácticas antihigiénicas, tales como escupir, comer o fumar dentro del área de proceso.' },
          { id: '3.1-4', numeral: '3.4', text: 'El personal manipulador de alimentos usa dotación y vestimenta de color claro, con cierre, cremallera o broche (no botones). Usa el uniforme completo (gorro, delantal, zapatos cerrados y tapabocas) y éste se observa limpio y en buen estado.' },
          { id: '3.1-5', numeral: '3.5', text: 'El personal manipulador de alimentos no sale con el uniforme fuera de las instalaciones durante el proceso productivo.' },
          { id: '3.1-6', numeral: '3.6', text: 'El personal manipulador de alimentos que está en contacto directo con el producto, no presenta afecciones en la piel o enfermedades infectocontagiosas.' },
          { id: '3.1-7', numeral: '3.8', text: 'El personal no transita de áreas más contaminadas a menos contaminadas.' },
          { id: '3.1-8', numeral: '1.9', text: 'Los visitantes cumplen con todas las normas de higiene y protección: delantal, gorro, tapabocas, prácticas de higiene, etc.' }
        ]
      }
    ]
  },
  {
    id: '4',
    title: '4. REQUISITOS HIGIÉNICOS',
    subsections: [
      {
        id: '4.1',
        title: '4. Aspectos a Verificar',
        items: [
          { id: '4.1-1', numeral: '4.1', text: 'Los productos mantienen la cadena de frío o de calor y se almacenan a temperatura adecuada para cada alimento. Temperaturas calientes mínimo 60°C. T frías 2-6°C y congelación a -18°C o menos. Para el pollo 73°C y refrigeración entre -2 a 4°C.' },
          { id: '4.1-2', numeral: '4.2', text: 'Las materias primas que así lo requieren, son lavadas con agua potable y desinfectadas previo al uso.' },
          { id: '4.1-3', numeral: '4.4', text: 'Se previene la contaminación cruzada en almacenamiento, proceso, envase o servido, distribución y no hay un contacto directo de las manos del manipulador con los productos terminados o que requieran ser servidos.' },
          { id: '4.1-4', numeral: '4.5', text: 'Las materias primas y los productos elaborados se encuentran bien protegidos de la contaminación. Se siguen las recomendaciones del proveedor en cuanto al adecuado almacenamiento de las materias primas que así lo requieran (por ejemplo, salsas y aderezos).' },
          { id: '4.1-5', numeral: '4.6', text: 'Las materias primas y/o productos elaborados se encuentran en empaques o recipientes adecuados, rotulados e identificados con el nombre, lote y/o fecha de producción, y fecha de vencimiento, los rotulos generales y nutricionales cumplen con las normativas vigentes.' },
          { id: '4.1-6', numeral: '4.7', text: 'No se evidencian productos elaborados, materias primas o insumos vencidos o en mal estado en áreas no identificadas o destinadas para almacenar temporalmente este tipo de productos.' },
          { id: '4.1-7', numeral: '4.8', text: 'Las materias primas y productos terminados no están en contacto con superficies antihigiénicas ni contacto directo con superficies como pisos y paredes.' },
          { id: '4.1-8', numeral: '5.7', text: 'Las operaciones de fabricación se realizan en forma secuencial y continua de manera que no se producen retrasos indebidos que permitan la proliferación de microorganismos o la contaminación del producto. Son suficientes y están validadas para las condiciones del proceso.' }
        ]
      }
    ]
  },
  {
    id: '5',
    title: '5. ABASTECIMIENTO DE AGUA',
    subsections: [
      {
        id: '5.1',
        title: '5. Aspectos a Verificar',
        items: [
          { id: '5.1-1', numeral: '5.1', text: 'El establecimiento dispone de un programa de abastecimiento de agua potable, acorde con su actividad. Posee registros, análisis fisicoquímicos y microbiológicos (reportes locales) que soportan el cumplimiento de éste, están al día y se registra la información de forma verídica.' },
          { id: '5.1-2', numeral: '5.2', text: 'El establecimiento dispone de suministro de agua potable en cantidad suficiente para las actividades que se realicen, así como para las operaciones de limpieza y desinfección.' },
          { id: '5.1-3', numeral: '5.3', text: 'El sistema de almacenamiento de agua (canecas o tanques), es de fácil acceso, garantiza la potabilidad del agua, está construido con materiales sanitarios, es de capacidad suficiente para un día de trabajo, se usa y se limpia y desinfecta periódicamente.' },
          { id: '5.1-4', numeral: '5.4', text: 'Se cuenta con análisis microbiológicos y fisicoquímicos dados por un laboratorio autorizado (pH, cloro residual, color aparente, turbiedad, nitritos, enterobacterias, escherichia coli, pseudomona aeruginosa).' },
          { id: '5.1-5', numeral: '5.5', text: 'Se realizan las mediciones de pH y cloro residual utilizando el sistema DPD.' }
        ]
      }
    ]
  },
  {
    id: '6',
    title: '6. LIMPIEZA Y DESINFECCIÓN',
    subsections: [
      {
        id: '6.1',
        title: '6. Aspectos a Verificar',
        items: [
          { id: '6.1-1', numeral: '6.1', text: 'El establecimiento dispone de un programa de limpieza y desinfección escrito, acorde con su actividad y posee registros que soportan el cumplimiento de éste, están al día y se registra la información de forma verídica. El programa especifica los POES y OS.' },
          { id: '6.1-2', numeral: '6.2', text: 'Se evidencia el registro de procedimientos pre operativos, operativos y post operativos que se requieran para garantizar la inocuidad de los procesos.' },
          { id: '6.1-3', numeral: '6.3', text: 'Se poseen las fichas técnicas y hojas de seguridad de los insumos utilizados así mismos están separados y almacenados en cuartos que evitan la contaminación cruzada con áreas de proceso o alimentos.' },
          { id: '6.1-4', numeral: '6.4', text: 'Se tienen claramente definidos los métodos, productos utilizados, elementos para dosificar, fichas técnicas, concentraciones, empleo y periodicidad de la limpieza y desinfección; por ende se posee una tabla de dosificación.' },
          { id: '6.1-5', numeral: '6.5', text: 'El área destinada para al almacenamiento de elementos e insumos de aseo se encuentra separada de los alimentos, organizada y limpia.' },
          { id: '6.1-6', numeral: '6.6', text: 'Los pisos, paredes, techos, luminarias, puertas, cortinas y/o ventanas de las áreas e instalaciones del establecimiento se encuentran limpios.' },
          { id: '6.1-7', numeral: '6.7', text: 'Los equipos, mesones, utensilios, menaje y otros elementos que hacen parte del proceso productivo se encuentran limpios.' },
          { id: '6.1-8', numeral: '6.8', text: 'Las alacenas, cajones de almacenamiento, estantes, estibas y/o canastillas se encuentran limpios.' },
          { id: '6.1-9', numeral: '6.9', text: 'Las mesas y sillas se encuentran limpias y en buen estado.' }
        ]
      }
    ]
  },
  {
    id: '7',
    title: '7. MANEJO INTEGRADO DE PLAGAS',
    subsections: [
      {
        id: '7.1',
        title: '7. Aspectos a Verificar',
        items: [
          { id: '7.1-1', numeral: '7.1', text: 'El establecimiento dispone de un programa de manejo integral de plagas escrito, acorde con su actividad y posee registros que soportan el cumplimiento de éste, están al día y se registra la información de forma periódica como una autoevaluación de las instalaciones, dicho programa debe contener: Enfoque de control.' },
          { id: '7.1-2', numeral: '7.2', text: 'No se evidencia la presencia de plagas o daños ocasionados por estas y se cuenta con medidas de control integral de tipo preventivo, para evitar su aparición.' },
          { id: '7.1-3', numeral: '7.3', text: 'En caso de requerirse, se cuenta con certificado de manejo integrado de plagas expedido por una empresa avalada para tal fin. Se cuenta con las fichas técnicas de los productos aplicados y demás documentos que autentifiquen el servicio brindado como el concepto sanitario expedido anualmente por la entidad sanitaria competente.' }
        ]
      }
    ]
  },
  {
    id: '8',
    title: '8. MANEJO Y DISPOSICIÓN DE RESIDUOS',
    subsections: [
      {
        id: '8.1',
        title: '8. Aspectos a Verificar',
        items: [
          { id: '8.1-1', numeral: '8.1', text: 'El establecimiento dispone de un programa de manejo de residuos sólidos y líquidos (si aplica), acorde con su actividad y posee registros que soportan el cumplimiento de éste, están al día y se registra la información de forma verídica.' },
          { id: '8.1-2', numeral: '8.2', text: 'Se cuenta con recipientes para recolección de residuos sólidos (basuras) con su respectiva bolsa y tapa, están identificados y ubicados de tal forma que eviten la contaminación. Se encuentran sin exceso de basura y se evacuan con frecuencia.' },
          { id: '8.1-3', numeral: '8.3', text: 'Existe un área destinada exclusivamente para el depósito temporal de los residuos sólidos, adecuadamente ubicada, identificada, protegida y en buen estado de mantenimiento. Se cuenta con instalaciones, áreas, elementos y procedimientos escritos e implementados que garanticen una eficiente labor de separación, recolección, conducción y transporte interno de residuos líquidos y sólidos.' },
          { id: '8.1-4', numeral: '8.4', text: 'De generarse residuos peligrosos, el establecimiento cuenta con los mecanismos requeridos para manejo y disposición de los mismos.' },
          { id: '8.1-5', numeral: '8.5', text: 'Se cuenta con certificado de disposición de aceite de cocina usado (disposición inicial y disposición final) o Se cuenta con áreas para el manejo de los productos cárnicos no comestibles sin que se constituyan en fuente de contaminación para los productos comestibles y para las demás áreas de la planta.' },
          { id: '8.1-6', numeral: '8.6', text: 'Se cuenta con certificado de disposición de residuos recolectados después de la limpieza de las trampas de grasa, así mismo el establecimiento cuenta con trampa de grasas alejadas de las áreas de producción o protegidas y lavadas constantemente.' }
        ]
      }
    ]
  },
  {
    id: '9',
    title: '9. CAPACITACIONES Y EXAMENES DEL MANIPULADOR',
    subsections: [
      {
        id: '9.1',
        title: '9. Aspectos a Verificar',
        items: [
          { id: '9.1-1', numeral: '9.1', text: 'Se cuenta con un plan de capacitación continuo y permanente para el personal manipulador de alimentos, tiene una duración de por lo menos 10 horas anuales y contiene temas relacionados con BPM y BPH (como evidencia se cuenta con registros de asistencia y evaluación de cada uno de los participantes).' },
          { id: '9.1-2', numeral: '9.4', text: 'Se tiene disponible copia vigente del certificado de aptitud médica del personal manipulador de alimentos.' }
        ]
      }
    ]
  },
  {
    id: '10',
    title: '10. PROGRAMAS Y DOCUMENTOS COMPLEMENTARIOS',
    subsections: [
      {
        id: '10.1',
        title: '10. Aspectos a Verificar',
        items: [
          { id: '10.1-1', numeral: '10.1', text: 'Programa de mantenimiento de instalaciones y equipos: La planta ha diseñado e implementado un programa documentado de mantenimiento de instalaciones y equipos. El programa incluye las actividades de monitoreo, registro y verificación por parte del establecimiento y se garantizan las condiciones adecuadas para la operación del mismo.' },
          { id: '10.1-2', numeral: '10.2', text: 'Existen procedimientos y registros escritos para control de calidad durante la recepción de las materias primas e insumos, donde se señalen especificaciones de calidad (condiciones de conservación, rechazos).' },
          { id: '10.1-3', numeral: '10.3', text: 'Programa de retiro del producto del mercado. El establecimiento cuenta con un sistema adecuado que permita retirar el producto del mercado, cuando se compruebe que está siendo comercializado y no cumpla con las condiciones de etiquetado o rotulado, cuando presente alteración, adulteración, contaminación o cualquier otra causa que genere engaño, fraude o error en el consumidor o que sean productos no aptos para el consumo humano.' },
          { id: '10.1-4', numeral: '10.4', text: 'Programa de trazabilidad. El establecimiento desarrolló, implementó y opera el programa de trazabilidad de acuerdo a lo definido por el Ministerio de Salud y Protección Social.' },
          { id: '10.1-5', numeral: '10.5', text: 'Laboratorios. La planta cuenta con laboratorio propio o contratado que esté autorizado por la autoridad sanitaria competente, con el fin de realizar las pruebas necesarias para implementar los planes y programas orientados a mantener la inocuidad del producto.' },
          { id: '10.1-6', numeral: '10.6', text: 'Mantenimiento de los procedimientos operativos estandarizados de saneamiento (POES). El establecimiento evalúa permanentemente la efectividad de los POES, para prevenir la contaminación directa o adulteración de los productos y los revisa cuando sea necesario, para mantenerlos actualizados.' },
          { id: '10.1-7', numeral: '10.7', text: 'Acciones correctivas de los POES. El establecimiento toma las acciones correctivas apropiadas cuando se determine que los POES no son eficaces, incluyendo procedimientos para asegurar la adecuada eliminación de productos contaminados, restaurar las condiciones sanitarias y prevenir la recurrencia de los factores que generan la contaminación.' },
          { id: '10.1-8', numeral: '10.8', text: 'La planta tiene implementado un plan de muestreo de microorganismos, el cual se determinó con base en los riesgos microbiológicos para la salud pública. El plan incluye procedimiento de toma de muestra, técnicas de muestreo, frecuencia y acciones correctivas.' },
          { id: '10.1-9', numeral: '10.9', text: 'Los materiales de empaque cuentan con los respectivos estudios de migración y la empresa proveedora cuenta con los certificados expedidos por la autoridad sanitaria al igual que su concepto sanitario de favorabilidad.' },
          { id: '10.1-10', numeral: '10.10', text: 'La planta establece la vida útil del producto. Cuenta con estudios de estabilidad para establecer la vida útil del producto.' },
          { id: '10.1-11', numeral: '10.11', text: 'Las condiciones de transporte excluyen la posibilidad de contaminación y/o proliferación microbiana y asegura la conservación requerida por el producto (refrigeración, congelación, etc.) y se llevan los respectivos registros de control.' },
          { id: '10.1-12', numeral: '10.12', text: 'El vehículo cuenta con las respectivas autorizaciones expedidas por los entes territoriales de salud.' },
          { id: '10.1-13', numeral: '10.13', text: 'De poseer frío, la temperatura es adecuada para mantener la cadena de frío de los alimentos que requieran refrigeración o congelación.' },
          { id: '10.1-14', numeral: '10.14', text: 'Los vehículos se encuentran en adecuadas condiciones sanitarias, de aseo, mantenimiento y operación para el transporte de los productos.' }
        ]
      }
    ]
  }
];

export const SECTIONS_SECRETARIA: Section[] = [
  {
    "id": "1",
    "title": "1. EDIFICACIÓN E INSTALACIONES",
    "subsections": [
      {
        "id": "1.1",
        "title": "1.1 Localización y diseño",
        "items": [
          { "id": "1.1-1-i", "numeral": "1.1", "text": "Estarán ubicados en lugares aislados de cualquier foco de insalubridad que represente riesgos potenciales para la contaminación del alimento." },
          { "id": "1.1-2-i", "numeral": "1.2", "text": "Su funcionamiento no debe poner en riesgo la salud y el bienestar de la comunidad. represente riesgos potenciales para la contaminación del alimento." },
          { "id": "1.1-3-i", "numeral": "1.3", "text": "Sus accesos y alrededores se mantendrán limpios, libres de acumulación de basuras y deberán tener superficies pavimentadas o recubiertas con materiales que faciliten el mantenimiento sanitario e impidan la generación de polvo, el estancamiento de aguas o la presencia de otras fuentes de contaminación para el alimento." },
          { "id": "1.1-4-i", "numeral": "2.1", "text": "La edificación debe estar diseñada y construida de manera que proteja los ambientes de producción e impida la entrada de polvo, lluvia, suciedades u otros contaminantes, así como del ingreso y refugio de plagas y animales domésticos." },
          { "id": "1.1-5-i", "numeral": "2.3", "text": "Los diversos ambientes de la edificación deben tener el tamaño adecuado para la instalación, operación y mantenimiento de los equipos, así como para la circulación del personal y el traslado de materiales o productos. Estos ambientes deben estar ubicados según la secuencia lógica del proceso, desde la recepción de los insumas hasta el despacho del producto terminado, de tal manera que se eviten retrasos indebidos y la contaminación cruzada. De ser requerido, tales ambientes deben dotarse de las condiciones de temperatura, humedad u otras necesarias para la ejecución higiénica de las operaciones de producción y/o para la conservación del alimento." },
          { "id": "1.1-6-i", "numeral": "2.6", "text": "Sus áreas deben ser independientes y separadas físicamente de cualquier tipo de vivienda y no pueden ser utilizadas como dormitorio." },
          { "id": "1.1-7-i", "numeral": "1", "text": "Su funcionamiento no debe poner en riesgo la salud y el bienestar de la comunidad." },
          { "id": "1.1-8-i", "numeral": "2", "text": "Sus áreas deben ser independientes de cualquier tipo de vivienda y no pueden ser utilizadas como dormitorio" },
          { "id": "1.1-9-i", "numeral": "3", "text": "Se localizarán en sitios secos, no inundables y en terrenos de fácil drenaje" },
          { "id": "1.1-10-i", "numeral": "4", "text": "No se podrán localizar junto a botaderos de basura, pantanos, ciénagas y sitios que puedan ser criaderos de insectos, roedores u otro tipo de plaga." },
          { "id": "1.1-11-i", "numeral": "6", "text": "Los alrededores se conservarán en perfecto estado de aseo, libres de acumulación de basuras, formación de charcos o estancamientos de agua" },
          { "id": "1.1-12-i", "numeral": "7", "text": "Deben estar diseñados y construidos para evitar la presencia de insectos, roedores u otro tipo de plaga" },
          { "id": "1.1-13-i", "numeral": "8", "text": "Se prohíbe el acceso de animales y la presencia de personas diferentes a los manipuladores de alimentos." }
        ]
      },
      {
        "id": "1.2",
        "title": "1.2 Condiciones de pisos y paredes",
        "items": [
          { "id": "1.2-1-i", "numeral": "1.1", "text": "Los pisos deben estar construidos con materiales que no generen sustancias o contaminantes tóxicos, resistentes, no porosos, impermeables, no absorbentes, no deslizantes y con acabados libres de grietas o defectos que dificulten la limpieza, desinfección y mantenimiento sanitario." },
          { "id": "1.2-2-i", "numeral": "1.2", "text": " El piso de las áreas húmedas de elaboración debe tener una pendiente mínima de 2% y al menos un drenaje de 10 cm de diámetro por cada 40 m2 de área servida; mientras que en las áreas de baja humedad ambiental y en los almacenes, la pendiente mínima será del 1% hacia los drenajes, se requiere de al menos un drenaje por cada 90 m2 de área servida. Los pisos de las cavas o cuartos fríos de refrigeración o congelación deben tener pendiente hacia drenajes ubicados preferiblemente en su parte exterior." },
          { "id": "1.2-3-i", "numeral": "1.3", "text": "Cuando el drenaje de las cavas o cuartos fríos de refrigeración o congelación se encuentren en el interior de los mismos, se debe disponer de un mecanismo que garantice el sellamiento total del drenaje, el cual puede ser removido para propósitos de limpieza y desinfección." },
          { "id": "1.2-4-i", "numeral": "1.4", "text": "El sistema de tuberías y drenajes para la conducción y recolección de las aguas residuales, debe tener la capacidad y la pendiente requeridas para permitir una salida rápida y efectiva de los volúmenes máximos generados por el establecimiento. Los drenajes de piso deben tener la debida protección con rejillas y si se requieren trampas adecuadas para grasas y/o sólidos, deben estar diseñadas de forma que permitan su limpieza." },
          { "id": "1.2-5-i", "numeral": "2.1", "text": "En las áreas de elaboración y envasado, las paredes deben ser de materiales resistentes, colores claros, impermeables, no absorbentes y de fácil limpieza y desinfección. Además, según el tipo de proceso hasta una altura adecuada, las mismas deben poseer acabado liso y sin grietas, pueden recubrirse con pinturas plásticas de colores claros que reúnan los requisitos antes indicados" },
          { "id": "1.2-6-i", "numeral": "2.2", "text": "Las uniones entre las paredes y entre éstas y los pisos, deben estar selladas y tener forma redondeada para impedir la acumulación de suciedad y facilitar la limpieza y desinfección." },
          { "id": "1.2-7-i", "numeral": "1", "text": "Los pisos deben estar construidos con materiales que no generen sustancias o contaminantes tóxicos, resistentes, no porosos, impermeables no absorbentes, no deslizantes y con acabados libres de grietas o defectos que dificulten la limpieza, desinfección y el mantenimiento sanitario." },
          { "id": "1.2-8-i", "numeral": "2", "text": "El piso de las áreas húmedas de elaboración debe tener una pendiente mínima de 2% y al menos un drenaje de 10 cm de diámetro por cada 40 m2 de área servida; mientras que en las áreas de baja humedad ambiental y en los almacenes, la pendiente mínima será del 1% hacia los drenajes, se requiere de al menos un drenaje por cada 90 m2 de área servida. Los pisos de las cavas o cuartos fríos de refrigeración o congelación deben tener pendiente hacia drenajes ubicados preferiblemente en su parte exterior. Cuando el drenaje de las cavas o cuartos fríos de refrigeración o congelación se encuentren en el interior de los mismos, se debe disponer de un mecanismo que garantice el sellamiento total del drenaje, el cual puede ser removido para propósitos de limpieza y desinfección." },
          { "id": "1.2-9-i", "numeral": "3", "text": "Las paredes deben ser de colores claros, materiales resistentes, impermeables, no absorbentes y de fácil limpieza y desinfección. Además hasta una altura adecuada, las mismas deben poseer acabado liso y sin grietas, pueden recubrirse con material cerámico o similar o con pinturas plásticas que reúnan los requisitos antes indicados." }
        ]
      },
      {
        "id": "1.3",
        "title": "1.3 Techos,iluminación y ventilación",
        "items": [
          { "id": "1.3-1-i", "numeral": "3.1", "text": "Los techos deben estar diseñados y construidos de manera que se evite la acumulación de suciedad, la condensación, la formación de hongos y levaduras, el desprendimiento superficial y además facilitar la limpieza y el mantenimiento." },
          { "id": "1.3-2-i", "numeral": "3.2", "text": "En lo posible, no se debe permitir el uso de techos falsos o dobles techos, a menos que se construyan con materiales impermeables, resistentes, lisos, de fácil limpieza y con accesibilidad a la cámara superior para realizar la limpieza, desinfección y desinfestación." },
          { "id": "1.3-3-i", "numeral": "3.3", "text": "En el caso de los falsos techos, las láminas utilizadas, deben fijarse de tal manera que se evite su fácil remoción por acción de corrientes de aire u otro factor externo ajeno a las labores de limpieza, desinfección y desinfestación." },
          { "id": "1.3-4-i", "numeral": "4.1", "text": "Las ventanas y otras aberturas en las paredes deben construirse de manera tal que se evite la entrada y acumulación de polvo, suciedades, al igual que el ingreso de plagas y facilitar la limpieza y desinfección." },
          { "id": "1.3-5-i", "numeral": "4.2", "text": "Las ventanas que se comuniquen con el ambiente exterior, deben estar diseñadas de tal manera que se evite el ingreso de plagas y otros contaminantes, y estar provistas con malla anti-insecto de fácil limpieza y buena conservación que sean resistentes a la limpieza y la manipulación. Los vidrios de las ventanas ubicadas en áreas de proceso deben tener protección para evitar contaminación en caso de ruptura." },
          { "id": "1.3-6-i", "numeral": "5.1", "text": "Las puertas deben tener superficie lisa, no absorbente, deben ser resistentes y de suficiente amplitud; donde se precise, tendrán dispositivos de cierre automático y ajuste hermético. Las aberturas entre las puertas exteriores y los pisos, y entre éstas y las paredes deben ser de tal manera que se evite el ingreso de plagas." },
          { "id": "1.3-7-i", "numeral": "5.2", "text": "No deben existir puertas de acceso directo desde el exterior a las áreas de elaboración; cuando sea necesario debe utilizarse una puerta de doble servicio. Todas las puertas de las áreas de elaboración deben ser, en lo posible, autocerrables para mantener las condiciones atmosféricas diferenciales deseadas." },
          { "id": "1.3-8-i", "numeral": "7.1", "text": "tendrán una adecuada y suficiente iluminación natural o artificial, la cual se obtendrá por medio de ventanas, claraboyas, y lámparas convenientemente distribuidas" },
          { "id": "1.3-9-i", "numeral": "7.2", "text": " La iluminación debe ser de la calidad e intensidad adecuada para la ejecución higiénica y efectiva de todas las actividades." },
          { "id": "1.3-10-i", "numeral": "7.3", "text": "Las lámparas, accesorios y otros medios de iluminación del establecimiento deben ser del tipo de seguridad y estar protegidos para evitar la contaminación en caso de ruptura y, en general, contar con una iluminación uniforme que no altere los colores naturales" },
          { "id": "1.3-11-i", "numeral": "8.1", "text": " Las áreas de elaboración poseerán sistemas de ventilación directa o indirecta, los cuales no deben crear condiciones que contribuyan a la contaminación de estas o a la incomodidad del personal. La ventilación debe ser adecuada para prevenir la condensación del vapor, polvo y facilitar la remoción del calor. Las aberturas para circulación del aire estarán protegidas con mallas anti-insectos de material no corrosivo y serán fácilmente removibles para su limpieza y reparación." },
          { "id": "1.3-12-i", "numeral": "8.2", "text": "Los sistemas de ventilación deben filtrar el aire y proyectarse y construirse de manera que el aire no fluya nunca de zonas contaminadas a zonas limpias, y de forma que se les realice limpieza y mantenimiento periódico." },
          { "id": "1.3-13-i", "numeral": "4", "text": "Los techos deben estar diseñados de manera que se evite la acumulación de suciedad, la condensación, la formación de hongos, el desprendimiento superficial y además se facilite la limpieza y al mantenimiento. En lo posible, no se debe permitir el uso de techos falsos o dobles techos." }
        ]
      },
      {
        "id": "1.4",
        "title": "1.4 Instalaciones sanitarias",
        "items": [
          { "id": "1.4-1-i", "numeral": "6.1", "text": "Deben disponer de instalaciones sanitarias en cantidad suficiente tales como servicios sanitarios y vestidor, independientes para hombres y mujeres, separados de las áreas de elaboración. Para el caso de microempresas que tienen un reducido número de operarios (no más de 6 operarios), se podrá disponer de un baño para el servicio de hombres y mujeres." },
          { "id": "1.4-2-i", "numeral": "6.2", "text": "Los servicios sanitarios deben mantenerse limpios y proveerse de los recursos requeridos para la higiene personal, tales como pero sin limitarse a: papel higiénico, dispensador de jabón desinfectante, implementos desechables o equipos automáticos para el secado de las manos y papeleras de accionamiento indirecto o no manual" },
          { "id": "1.4-3-i", "numeral": "6.3", "text": "Se deben instalar lavamanos con grifos de accionamiento no manual dotados con dispensador de jabón desinfectante, implementos desechables o equipos automáticos para el secado de manos, en las áreas de elaboración o próximos a éstas para la higiene del personal que participe en la manipulación de los alimentos y para facilitar la supervisión de estas prácticas. Estas áreas deben ser de uso exclusivo para este propósito." },
          { "id": "1.4-4-i", "numeral": "6.4", "text": "En las proximidades de los lavamanos se deben colocar avisos o advertencias al personal sobre la necesidad de lavarse las manos luego de usar los servicios sanitarios, después de cualquier cambio de actividad y antes de iniciar las labores de producción." },
          { "id": "1.4-5-i", "numeral": "9", "text": "Contarán con servicios sanitarios para el personal que labora en el establecimiento, debidamente dotados y separados del área de preparación de los alimentos." },
          { "id": "1.4-6-i", "numeral": "11", "text": "Contarán con servicio sanitario en cantidad suficiente para uso público, salvo que por limitaciones del espacio físico no lo permita, caso en el cual se podrían utilizar los servicios sanitarios de uso del personal que labora en el establecimiento o los ubicados en los centros comerciales, los cuales deben estar separados por sexo y debidamente dotados y estar en perfecto estado de funcionamiento y aseo." }
        ]
      }
    ]
  },
  {
    "id": "2",
    "title": "2. EQUIPOS Y UTENSILIOS",
    "subsections": [
      {
        "id": "2.1",
        "title": "2.1 Condiciones de equipos y utensilios",
        "items": [
          { "id": "2.1-1-i", "numeral": "Art 8", "text": "Los equipos y utensilios utilizados en el procesamiento, fabricación, preparación, envasado y expendio de alimentos dependen del tipo del alimento, materia prima o insumo, de la tecnología a emplear y de la máxima capacidad de producción prevista. Todos ellos deben estar diseñados, construidos, instalados y mantenidos de manera que se evite la contaminación del alimento, facilite la limpieza y desinfección de sus superficies y permitan desempeñar adecuadamente el uso previsto." },
          { "id": "2.1-2-i", "numeral": "1", "text": "Los equipos y utensilios empleados en el manejo de alimentos deben estar fabricados con materiales resistentes al uso y a la corrosión, así como a la utilización frecuente de los agentes de limpieza y desinfección" },
          { "id": "2.1-3-i", "numeral": "6", "text": "En los espacios interiores en contacto con el alimento, los equipos no deben poseer piezas o accesorios que requieran lubricación ni roscas de acoplamiento u otras conexiones peligrosas." },
          { "id": "2.1-4-i", "numeral": "8", "text": " En lo posible los equipos deben estar diseñados y construidos de manera que se evite el contacto del alimento con el ambiente que lo rodea." },
          { "id": "2.1-5-i", "numeral": "9", "text": "Las superficies exteriores de los equipos deben estar diseñadas y construidas de manera que faciliten su limpieza y desinfección y eviten la acumulación de suciedades, microorganismos, plagas u otros agentes contaminantes del alimento." },
          { "id": "2.1-6-i", "numeral": "2", "text": "La distancia entre los equipos y las paredes perimetrales, columnas u otros elementos de la edificación, debe ser tal que les permita funcionar adecuadamente y facilite el acceso para la inspección, mantenimiento, limpieza y desinfección." },
          { "id": "2.1-7-i", "numeral": "3", "text": "Los equipos que se utilicen en operaciones críticas para lograr la inocuidad del alimento, deben estar dotados de los instrumentos y accesorios requeridos para la medición y registro de las variables del proceso. Así mismo, deben poseer dispositivos para permitir la toma de muestras del alimento y materias primas." },
          { "id": "2.1-8-i", "numeral": "Art 34", "text": "Los equipos y utensilios empleados en los restaurantes y establecimientos gastronómicos, deben cumplir con las condiciones establecidas en el Capítulo 11 de la presente resolución. (Art 8, Art 9 y Art 10 )" }
        ]
      },
      {
        "id": "2.2",
        "title": "2.2 Superficies de contacto con el alimento.",
        "items": [
          { "id": "2.2-1-i", "numeral": "Art 8", "text": "Los equipos y utensilios utilizados en el procesamiento, fabricación, preparación, envasado y expendio de alimentos dependen del tipo del alimento, materia prima o insumo, de la tecnología a emplear y de la máxima capacidad de producción prevista. Todos ellos deben estar diseñados, construidos, instalados y mantenidos de manera que se evite la contaminación del alimento, facilite la limpieza y desinfección de sus superficies y permitan desempeñar adecuadamente el uso previsto." },
          { "id": "2.2-2-i", "numeral": "2", "text": "Resoluciones 683, 4142 Y 4143 de 2012 o las normas que las modifiquen, adicionen o sustituyan." },
          { "id": "2.2-3-i", "numeral": "3", "text": "Todas las superficies de contacto directo con el alimento deben poseer un acabado liso, no poroso, no absorbente y estar libres de defectos, grietas, intersticios u otras irregularidades que puedan atrapar partículas de alimentos o microorganismos que afectan la inocuidad de los alimentos. Podrán emplearse otras superficies cuando exista una justificación tecnológica y sanitaria específica, cumpliendo con la reglamentación expedida por el Ministerio de Salud y Protección Social." },
          { "id": "2.2-4-i", "numeral": "4", "text": "Todas las superficies de contacto con el alimento deben ser fácilmente accesibles o desmontables para la limpieza, desinfección e inspección." },
          { "id": "2.2-5-i", "numeral": "5", "text": "Los ángulos internos de las superficies de contacto con el alimento deben poseer una curvatura continua y suave, de manera que puedan limpiarse con facilidad." },
          { "id": "2.2-6-i", "numeral": "7", "text": "Las superficies de contacto directo con el alimento no deben recubrirse con pinturas u otro tipo de material desprendible que represente un riesgo para la inocuidad del alimento." },
          { "id": "2.2-7-i", "numeral": "10", "text": "superficies lisas, con bordes sin aristas y estar construidas con materiales resistentes, impermeables y de fácil limpieza y desinfección." },
          { "id": "2.2-8-i", "numeral": "Art 34", "text": "Los equipos y utensilios empleados en los restaurantes y establecimientos gastronómicos, deben cumplir con las condiciones establecidas en el Capítulo 11 de la presente resolución. (Art 8, Art 9 y Art 10 )" },
          { "id": "2.2-9-i", "numeral": "8", "text": "EL lavado y desinfección de utensilios debe hacerse con agua potable corriente, jabón o detergente y cepillo y con especial cuidado en las superficies donde se pican o fraccionan los alimentos, las cuales deben estar en buen estado de conservación e higiene; las superficies para el picado deben ser de material sanitario, de preferencia plástico, nylon, polietileno o teflón." },
          { "id": "2.2-10-i", "numeral": "10", "text": "Cuando los establecimientos no cuenten con agua y equipos en cantidad y calidad suficientes para el lavado y desinfección, los utensilios que se utilicen deben ser desechables con el primer uso." },
          { "id": "2.2-11-i", "numeral": "Res", "text": "Res 683, 4142 y 4143 de 2012; 834 y 835 de 2013" }
        ]
      }
    ]
  },
  {
    "id": "3",
    "title": "3. PERSONAL MANIPULADOR DE ALIMENTOS",
    "subsections": [
      {
        "id": "3.1",
        "title": "3.1 Estado de salud",
        "items": [
          { "id": "3.1-1-i", "numeral": "1", "text": "Contar con una certificación médica en el cual conste la aptitud o no para la manipulación de alimentos. La empresa debe tomar las medidas correspondientes para que al personal manipulador de alimentos se le practique un reconocimiento médico, por lo menos una vez al año." },
          { "id": "3.1-2-i", "numeral": "2", "text": "Debe efectuarse un reconocimiento médico cada vez que se considere necesario por razones clínicas y epidemiológicas, especialmente después de una ausencia del trabajo motivada por una infección que pudiera dejar secuelas capaces de provocar contaminación de los alimentos que se manipulen. Dependiendo de la valoración efectuada por el médico, se deben realizar las pruebas de laboratorio clínico u otras que resulten necesarias, registrando las medidas correctivas y preventivas tomadas con el fin de mitigar la posible contaminación del alimento que pueda generarse por el estado de salud del personal manipulador." },
          { "id": "3.1-3-i", "numeral": "4", "text": " La empresa debe garantizar el cumplimiento y seguimiento a los tratamientos ordenados por el médico. Una vez finalizado el tratamiento, el médico debe expedir un certificado en el cual conste la aptitud o no para la manipulación de alimentos." },
          { "id": "3.1-4-i", "numeral": "5", "text": " La empresa es responsable de tomar las medidas necesarias para que no se permita contaminar los alimentos directa o indirectamente por una persona que se sepa o sospeche que padezca de una enfermedad susceptible de transmitirse por los alimentos, o que sea portadora de una enfermedad semejante, o que presente heridas infectadas, irritaciones cutáneas infectadas o diarrea. Todo manipulador de alimentos que represente un riesgo de este tipo debe comunicarlo a la empresa." },
          { "id": "3.1-5-i", "numeral": "12", "text": "El personal que presente afecciones de la piel o enfermedad infectocontagiosa debe ser excluido de toda actividad directa de manipulación de alimentos." }
        ]
      },
      {
        "id": "3.2",
        "title": "3.2 Reonocimiento médico",
        "items": [
          { "id": "3.2-1-i", "numeral": "1", "text": " Contar con una certificación médica en el cual conste la aptitud o no para la manipulación de alimentos. La empresa debe tomar las medidas correspondientes para que al personal manipulador de alimentos se le practique un reconocimiento médico, por lo menos una vez al año." },
          { "id": "3.2-2-i", "numeral": "2", "text": "Debe efectuarse un reconocimiento médico cada vez que se considere necesario por razones clínicas y epidemiológicas, especialmente después de una ausencia del trabajo motivada por una infección que pudiera dejar secuelas capaces de provocar contaminación de los alimentos que se manipulen. Dependiendo de la valoración efectuada por el médico, se deben realizar las pruebas de laboratorio clínico u otras que resulten necesarias, registrando las medidas correctivas y preventivas tomadas con el fin de mitigar la posible contaminación del alimento que pueda generarse por el estado de salud del personal manipulador" },
          { "id": "3.2-3-i", "numeral": "3", "text": "En todos los casos, como resultado de la valoración médica se debe expedir un certificado en el cual conste la aptitud o no para la manipulación de alimentos." },
          { "id": "3.2-4-i", "numeral": "4", "text": " La empresa debe garantizar el cumplimiento y seguimiento a los tratamientos ordenados por el médico. Una vez finalizado el tratamiento, el médico debe expedir un certificado en el cual conste la aptitud o no para la manipulación de alimentos" }
        ]
      },
      {
        "id": "3.3",
        "title": "3.3 Prácticas higiénicas",
        "items": [
          { "id": "3.3-1-i", "numeral": "1", "text": "Mantener una estricta limpieza e higiene personal y aplicar buenas prácticas higiénicas en sus labores, de manera que se evite la contaminación del alimento y de las superficies de contacto con éste." },
          { "id": "3.3-2-i", "numeral": "2", "text": " Usar vestimenta de trabajo que cumpla los siguientes requisitos: De color claro que permita visualizar fácilmente su limpieza; con cierres o cremalleras y/o broches en lugar de botones u otros accesorios que puedan caer en el alimento; sin bolsillos ubicados por encima de la cintura; cuando se utiliza delantal, éste debe permanecer atado al cuerpo en forma segura para evitar la contaminación del alimento y accidentes de trabajo. La empresa será responsable de una dotación de vestimenta de trabajo en número suficiente para el personal manipulador, con el propósito de facilitar el cambio de indumentaria el cual será consistente con el tipo de trabajo que desarrolla. En ningún caso se podrán aceptar colores grises o aquellos que impidan evidenciar su limpieza, en la dotación de los manipuladores de alimentos" },
          { "id": "3.3-3-i", "numeral": "3", "text": "El manipulador de alimentos no podrá salir e ingresar al establecimiento con la vestimenta de trabajo." },
          { "id": "3.3-4-i", "numeral": "4", "text": " Lavarse las manos con agua y jabón desinfectante, antes de comenzar su trabajo, cada vez que salga y regrese al área asignada y después de manipular cualquier material u objeto que pudiese representar un riesgo de contaminación para el alimento. Será obligatorio realizar la desinfección de las manos cuando los riesgos asociados con la etapa del proceso asi lo justifiquen" },
          { "id": "3.3-5-i", "numeral": "5", "text": "Mantener el cabello recogido y cubierto totalmente mediante malla, gorro u otro medio efectivo y en caso de llevar barba, bigote o patillas se debe usar cubiertas para estas. No se permite el uso de maquillaje." },
          { "id": "3.3-6-i", "numeral": "6", "text": "Dependiendo del riesgo de contaminación asociado con el proceso o preparación, será obligatorio el uso de tapabocas desechables cubriendo nariz y boca mientras se manipula el alimento. Es necesario evaluar sobre todo el riesgo asociado a un alimento de mayor y riesgo medio en salud pública en las etapas finales de elaboración o manipulación del mismo, cuando éste se encuentra listo para el consumo y puede estar expuesto a posible contaminación." },
          { "id": "3.3-7-i", "numeral": "7", "text": "Mantener las uñas cortas, limpias y sin esmalte." },
          { "id": "3.3-8-i", "numeral": "8", "text": "No se permite utilizar reloj, anillos, aretes, joyas u otros accesorios mientras el personal realice sus labores. En caso de usar lentes, deben asegurarse a la cabeza mediante bandas, cadenas u otros medios ajustables." },
          { "id": "3.3-9-i", "numeral": "9", "text": "Usar calzado cerrado, de material resistente e impermeable y de tacón bajo." },
          { "id": "3.3-10-i", "numeral": "10", "text": "De ser necesario el uso de guantes, éstos deben mantenerse limpios, sin roturas o desperfectos y ser tratados con el mismo cuidado higiénico de las manos sin protección. El material de los guantes, debe ser apropiado para la operación realizada y debe evitarse la acumulación de humedad y contaminación en su interior para prevenir posibles afecciones cutáneas de los operarios. El uso de guantes no exime al operario de la obligación de lavarse las manos, según lo contempla el numeral 4 del presente artículo." },
          { "id": "3.3-11-i", "numeral": "11", "text": "No está permitido comer, beber o masticar cualquier objeto o producto, como tampoco fumar o escupir en las áreas donde se manipulen alimentos." },
          { "id": "3.3-12-i", "numeral": "13", "text": "Los manipuladores no deben sentarse, acostarse, inclinarse o similares en el pasto, andenes o lugares donde la ropa de trabajo pueda contaminarse." },
          { "id": "3.3-13-i", "numeral": "14", "text": "Los visitantes a los establecimientos o plantas deben cumplir estrictamente todas las prácticas de higiene establecidas en esta resolución y portar la vestimenta y dotación adecuada, la cual debe ser suministrada por la empresa." },
          { "id": "3.3-14-i", "numeral": "Art 36", "text": "El propietario, la administración del establecimiento y el personal que labore como manipulador de alimentos, serán responsables de la inocuidad y la protección de los alimentos preparados y expendidos al consumidor. Los manipuladores de alimentos de los restaurantes y establecimientos gastronómicos deben recibir capacitación sobre manipulación higiénica de alimentos." },
          { "id": "3.3-15-i", "numeral": "5", "text": "El personal que está directamente vinculado a la preparación o servido de los alimentos no debe manipular dinero simultáneamente." },
          { "id": "3.3-16-i", "numeral": "7", "text": "El servido de los alimentos debe hacerse con utensilios (pinzas, cucharas, etc.) según sea el tipo de alimento, evitando en todo caso el contacto del alimento con las manos." }
        ]
      },
      {
        "id": "3.4",
        "title": "3.4 Educación y capacitación",
        "items": [
          { "id": "3.4-1-i", "numeral": "Art 12", "text": " Todas las personas que realizan actividades de manipulación de alimentos deben tener formación en educación sanitaria, principios básicos de Buenas Prácticas de Manufactura y prácticas higiénicas en manipulación de alimentos. Igualmente, deben estar capacitados para llevar a cabo las tareas que se les asignen o desempeñen, con el fin de que se encuentren en capacidad de adoptar las precauciones y medidas preventivas necesarias para evitar la contaminación o deterioro de los alimentos.Las empresas deben tener un plan de capacitación continuo y permanente para el personal manipulador de alimentos desde el momento de su contratación y luego ser reforzado mediante charlas, cursos u otros medios efectivos de actualización. Dicho plan debe ser de por lo menos 10 horas anuales, sobre asuntos específicos de que trata la presente resolución" },
          { "id": "3.4-2-i", "numeral": "Art 13", "text": "El plan de capacitación debe contener, al menos, los siguientes aspectos: Metodología, duración, docentes, cronograma y temas específicos a impartir. El enfoque, contenido y alcance de la capacitación impartida debe ser acorde con la empresa, el proceso tecnológico y tipo de establecimiento de que se trate. En todo caso, la empresa debe demostrar a través del desempeño de los operarios y la condición sanitaria del establecimiento la efectividad e impacto de la capacitación impartida." },
          { "id": "3.4-3-i", "numeral": "Art 36", "text": "El propietario, la administración del establecimiento y el personal que labore como manipulador de alimentos, serán responsables de la inocuidad y la protección de los alimentos preparados y expendidos al consumidor. Los manipuladores de alimentos de los restaurantes y establecimientos gastronómicos deben recibir capacitación sobre manipulación higiénica de alimentos." }
        ]
      }
    ]
  },
  {
    "id": "4",
    "title": "4. REQUISITOS HIGIENICOS",
    "subsections": [
      {
        "id": "4.1",
        "title": "4.1 Control de materias primas",
        "items": [
          { "id": "4.1-1-i", "numeral": "Dec 561- Art 89", "text": "Los productos de la pesca se descargarán y transportarán al área del proceso lo más rápido posible, evitando aumentos de temperatura y contacto con elementos contaminantes" },
          { "id": "4.1-2-i", "numeral": "1", "text": "La recepción de materias primas debe realizarse en condiciones que eviten su contaminación, alteración y daños físicos y deben estar debidamente identificadas de conformidad con la Resolución 5109 de 2005 o las normas que la modifiquen, adicionen o sustituyan, y para el caso de los insumos, deben cumplir con las Resoluciones 1506 de 2011 y/o la 683 de 2012, según corresponda, o las normas que las modifiquen, adicionen o sustituyan." },
          { "id": "4.1-3-i", "numeral": "3", "text": "Las materias primas e insumos deben ser inspeccionados previo al uso, clasificados y sometidos a análisis de laboratorio cuando así se requiera, para determinar si cumplen con las especificaciones de calidad establecidas al efecto. Es responsabilidad de la persona natural o jurídica propietaria del establecimiento, garantizar la calidad e inocuidad de las materias primas e insumos." },
          { "id": "4.1-4-i", "numeral": "4", "text": "Las materias primas se someterán a la limpieza con agua potable u otro medio adecuado de ser requerido y, si le aplica, a la descontaminación previa a su incorporación en las etapas sucesivas del proceso." },
          { "id": "4.1-5-i", "numeral": "5", "text": "Las materias primas conservadas por congelación que requieren ser descongeladas previo al uso, deben descongelarse a una velocidad controlada para evitar el desarrollo de microorganismos y no podrán ser recongeladas. Además, se manipularán de manera que se minimice la contaminación proveniente de otras fuentes" },
          { "id": "4.1-6-i", "numeral": "1", "text": "El recibo de insumos e ingredientes para la preparación y servido de alimentos se hará en un lugar limpio y protegido de la contaminación ambiental y se almacenarán en recipientes adecuados." },
          { "id": "4.1-7-i", "numeral": "2", "text": " Los alimentos o materias primas crudos, tales como, hortalizas, frutas, carnes y productos hidrobiológicos que se utilicen en la preparación de los alimentos deben ser lavados con agua potable corriente antes de su preparación." },
          { "id": "4.1-8-i", "numeral": "3", "text": "Las hortalizas y frutas que se consuman deben someterse a lavado y desinfección con sustancias autorizadas por el Ministerio de Salud y Protección Social." },
          { "id": "4.1-9-i", "numeral": "Res", "text": "Resolución 5109 de 2005 - Resolución 1506 de 2011- Resolución 683,4142 y 4143 de 2012" }
        ]
      },
      {
        "id": "4.2",
        "title": "4.2 Prevención de la contaminación cruzada",
        "items": [
          { "id": "4.2-1-i", "numeral": "7", "text": " Los depósitos de materias primas y productos terminados ocuparán espacios independientes, salvo en aquellos casos en que a juicio de la autoridad sanitaria competente no se presenten peligros de contaminación para los alimentos." },
          { "id": "4.2-2-i", "numeral": "7", "text": "Cuando en los procesos de fabricación se requiera el uso de hielo en contacto con los alimentos y materias primas, éste debe ser fabricado con agua potable y manipulado en condiciones que garanticen su inocuidad." },
          { "id": "4.2-3-i", "numeral": "5", "text": "Todo equipo y utensilio que haya entrado en contacto con materias primas o con material contaminado debe limpiarse y desinfectarse cuidadosamente antes de ser nuevamente utilizado." },
          { "id": "4.2-4-i", "numeral": "4", "text": "Los alimentos perecederos, tales como, leche y sus derivados, carne y preparados, productos de la pesca deben almacenarse en recipientes separados, bajo condiciones de refrigeración y/o congelación y no podrán almacenarse conjuntamente con productos preparados o listos para el consumo con el fin de evitar la contaminación cruzada." }
        ]
      },
      {
        "id": "4.3",
        "title": "4.3 Manejo de temperaturas",
        "items": [
          { "id": "4.3-1-i", "numeral": "Ley 9 de 1979- Art 293", "text": "Sólo se permitirá la cocción de alimentos por contacto directo con la llama, cuando en dicha operación no se produzca contaminación de los alimentos o cualquier otro fenómeno adverso para la salud." },
          { "id": "4.3-2-i", "numeral": "Ley 9 de 1979- Art 425", "text": "Una vez descongelado el alimento o la bebida no se permitirá su recongelación, ni su refrigeración." },
          { "id": "4.3-3-i", "numeral": "3.1", "text": " Mantener los alimentos a temperaturas de refrigeración no mayores de 4°C +/- 2°C." },
          { "id": "4.3-4-i", "numeral": "3.2", "text": "Mantener el alimento en estado congelado." },
          { "id": "4.3-5-i", "numeral": "3.3", "text": "Mantener el alimento caliente a temperaturas mayores de 60°C (140°F)." },
          { "id": "4.3-6-i", "numeral": "8", "text": "Las operaciones de fabricación deben realizarse en forma secuencial y continua para que no se produzcan retrasos indebidos que permitan el crecimiento de microorganismos, contribuyan a otros tipos de deterioro o contaminación del alimento. Cuando se requiera esperar entre una etapa del proceso y la siguiente, el alimento debe mantenerse protegido y en el caso de alimentos susceptibles al rápido crecimiento de microorganismos durante el tiempo de espera, deben emplearse temperaturas altas (> 60°C) o bajas no mayores de 4 oC +/_2°C según sea el caso." }
        ]
      },
      {
        "id": "4.4",
        "title": "4.4 Condiciones de almacenamiento",
        "items": [
          { "id": "4.4-1-i", "numeral": "5", "text": "Las materias primas conservadas por congelación que requieren ser descongeladas previo al uso, deben descongelarse a una velocidad controlada para evitar el desarrollo de microorganismos y no podrán ser recongeladas. Además, se manipularán de manera que se minimice la contaminación proveniente de otras fuentes." },
          { "id": "4.4-2-i", "numeral": "6", "text": "Las materias primas e insumas que requieran ser almacenadas antes de entrar a las etapas de proceso, deben almacenarse en sitios adecuados que eviten su contaminación y alteración." },
          { "id": "4.4-3-i", "numeral": "9", "text": "Se prohíbe el almacenamiento de sustancias peligrosas en la cocina, en las áreas de preparación de los alimentos o en las áreas de almacenamiento de materias primas." }
        ]
      }
    ]
  },
  {
    "id": "5",
    "title": "5. SANEAMIENTO",
    "subsections": [
      {
        "id": "5.1",
        "title": "5.1 Suministro y calidad de agua potable",
        "items": [
          { "id": "5.1-1-i", "numeral": "3.1", "text": "El agua que se utilice debe ser de calidad potable y cumplir con las normas vigentes establecidas por el Ministerio de Salud y Protección Social." },
          { "id": "5.1-2-i", "numeral": "3.2", "text": "Se debe disponer de agua potable a la temperatura y presión requeridas en las diferentes actividades que se realizan en el establecimiento, así como para una limpieza y desinfección efectiva." },
          { "id": "5.1-3-i", "numeral": "3.3", "text": "Solamente se permite el uso de agua no potable, cuando la misma no ocasione riesgos de contaminación del alimento; como en los casos de generación de vapor indirecto, lucha contra incendios, o refrigeración indirecta. En estos casos, el agua no potable debe distribuirse por un sistema de tuberías completamente separados e identificados por colores, sin que existan conexiones cruzadas ni sifonaje de retroceso con las tuberías de agua potable." },
          { "id": "5.1-4-i", "numeral": "3.5.1", "text": " Los pisos, paredes y tapas deben estar construidos con materiales que no generen sustancias o contaminantes tóxicos, deben ser resistentes, no porosos, impermeables, no absorbentes y con acabados libres de grietas o defectos que dificulten la limpieza y desinfección." },
          { "id": "5.1-5-i", "numeral": "3.5.2", "text": "Debe ser de fácil acceso para limpieza y desinfección periódica según lo establecido en el plan de saneamiento." },
          { "id": "5.1-6-i", "numeral": "3.5.3", "text": " Debe garantizar protección total contra el acceso de animales, cuerpos extraños o contaminación por aguas lluvias." },
          { "id": "5.1-7-i", "numeral": "4", "text": "Abastecimiento o suministro de agua potable. Todos los establecimientos de que trata la presente resolución deben tener documentado el proceso de abastecimiento de agua que incluye claramente: fuente de captación o suministro, tratamientos realizados, manejo, diseño y capacidad del tanque de almacenamiento, distribución; mantenimiento, limpieza y desinfección de redes y tanque de almacenamiento; controles realizados para garantizar el cumplimiento de los requisitos fisicoquímicos y microbiológicos establecidos en la normatividad vigente, así como los registros que soporte el cumplimiento de los mismos." },
          { "id": "5.1-8-i", "numeral": "8", "text": "Deben disponer de suficiente abastecimiento de agua potable" }
        ]
      },
      {
        "id": "5.2",
        "title": "5.2 Residuos Líquidos",
        "items": [
          { "id": "5.2-1-i", "numeral": "4.1", "text": "Dispondrán de sistemas sanitarios adecuados para la recolección, el tratamiento y la disposición de aguas residuales, aprobadas por la autoridad competente." },
          { "id": "5.2-2-i", "numeral": "4.2", "text": "El manejo de residuos líquidos dentro del establecimiento debe realizarse de manera que impida la contaminación del alimento o de las superficies de potencial contacto con éste." },
          { "id": "5.2-3-i", "numeral": "5", "text": " El manejo de residuos líquidos debe realizarse de manera que impida la contaminación del alimento o de las superficies de potencial contacto con éste." },
          { "id": "5.2-4-i", "numeral": "10", "text": "Deben tener sistemas sanitarios adecuados, para la disposición de aguas servidas y excretas." }
        ]
      },
      {
        "id": "5.3",
        "title": "5.3 Residuos Sólidos",
        "items": [
          { "id": "5.3-1-i", "numeral": "5.1", "text": "Los residuos sólidos que se generen deben ser ubicados de manera tal que no representen riesgo de contaminación al alimento, a los ambientes o superficies de potencial contacto con éste." },
          { "id": "5.3-2-i", "numeral": "5.2", "text": "Los residuos sólidos deben ser removidos frecuentemente de las áreas de producción y disponerse de manera que se elimine la generación de malos olores, el refugio y alimento de animales y plagas y que no contribuya de otra forma al deterioro ambiental." },
          { "id": "5.3-3-i", "numeral": "5.3", "text": "El establecimiento debe estar dotado de un sistema de recolección y almacenamiento de residuos sólidos que impida el acceso y proliferación de insectos, roedores y otras plagas, el cual debe cumplir con las normas sanitarias vigentes." },
          { "id": "5.3-4-i", "numeral": "5", "text": "Los residuos sólidos deben ser removidos frecuentemente del área de preparación de los alimentos y disponerse de manera que se elimine la generación de malos olores, el refugio y alimento para animales y plagas, y que no contribuya de otra forma al deterioro ambiental." },
          { "id": "5.3-5-i", "numeral": "6", "text": "Deben disponerse de suficientes, adecuados y bien ubicados recipientes así como de locales e instalaciones si es del caso para el almacenamiento de los residuos sólidos, conforme a lo establecido en las normas sanitarias vigentes." },
          { "id": "5.3-6-i", "numeral": "7", "text": "Debe disponerse de recipientes de material sanitario para el almacenamiento de desperdicios orgánicos debidamente tapados, alejados del lugar donde se preparan los alimentos y deben ser removidos, lavados y desinfectados frecuentemente." },
          { "id": "5.3-7-i", "numeral": "11", "text": "Los productos devueltos a la empresa por defectos de fabricación, que tengan incidencia sobre la inocuidad y calidad del alimento no podrán someterse a procesos de reenvase, reelaboración, reproceso, corrección o reesterilización bajo ninguna justificación." }
        ]
      },
      {
        "id": "5.4",
        "title": "5.4 Control Integral de plagas",
        "items": [
          { "id": "5.4-1-i", "numeral": "3", "text": "Control de plagas. Las plagas deben ser objeto de un programa de control específico, el cual debe involucrar el concepto de control integral, apelando a la aplicación armónica de las diferentes medidas de control conocidas, con especial énfasis en las radicales y de orden preventivo." }
        ]
      },
      {
        "id": "5.5",
        "title": "5.5 Limpieza y desinfección de áreas, equipos y utensilios.",
        "items": [
          { "id": "5.5-1-i", "numeral": "6.5", "text": "Cuando se requiera, las áreas de elaboración deben disponer de sistemas adecuados para la limpieza y desinfección de equipos y utensilios de trabajo. Estos sistemas deben construirse con materiales resistentes al uso y corrosión, de fácil limpieza y provistos con suficiente agua fría y/o caliente a temperatura no inferior a 8O°C." },
          { "id": "5.5-2-i", "numeral": "1", "text": "Limpieza y desinfección. Los procedimientos de limpieza y desinfección deben satisfacer las necesidades particulares del proceso y del producto de que se trate. Cada establecimiento debe tener por escrito todos los procedimientos, incluyendo los agentes y sustancias utilizadas, así como las concentraciones o formas de uso, tiempos de contacto y los equipos e implementos requeridos para efectuar las operaciones y periodicidad de limpieza y desinfección." }
        ]
      },
      {
        "id": "5.6",
        "title": "5.6 Soportes documentales de saneamiento",
        "items": [
          { "id": "5.6-1-i", "numeral": "1.", "text": "Lavar y desinfectar sus tanques de almacenamiento y redes, como mínimo cada seis (6) meses." },
          { "id": "5.6-2-i", "numeral": "2.", "text": "Mantener en adecuadas condiciones de operación la acometida y las redes internas domiciliarias para preservar la calidad del agua suministrada y de esta manera, ayudar a evitar problemas de salud pública." },
          { "id": "5.6-3-i", "numeral": "3.", "text": "En edificios públicos y privados, conjuntos habitacionales, fábricas de alimentos, hospitales, hoteles, colegios, cárceles y demás edificaciones que conglomeren individuos, los responsables del mantenimiento y conservación locativa, deberán realizar el lavado y desinfección de los tanques de almacenamiento de agua para consumo humano, como mínimo cada seis (6) meses. La autoridad sanitaria podrá realizar inspección cuando lo considere pertinente." },
          { "id": "5.6-4-i", "numeral": "Art 26", "text": ". Toda persona natural o jurídica propietaria del establecimiento que fabrique, procese, envase, embale, almacene y expenda alimentos y sus materias primas debe implantar y desarrollar un Plan de Saneamiento con objetivos claramente definidos y con los procedimientos requeridos para disminuir los riesgos de contaminación de los alimentos. Este plan debe estar escrito y a disposición de la autoridad sanitaria competente; éste debe incluir como mínimo los procedimientos, cronogramas, registros, listas de chequeo y responsables de los siguientes programas: 1. Limpieza y desinfección 2. Desechos sólidos 3. Control de plagas 4. Abastecimiento o suministro de agua potable" }
        ]
      }
    ]
  }
];

export const DEFAULT_DIAGNOSTIC_TYPE: DiagnosticType = 'INVIMA';

export const DIAGNOSTIC_CONFIG: Record<DiagnosticType, { title: string, sections: Section[] }> = {
  SECRETARIA: {
    title: 'Acta de Asesoría para Secretaría',
    sections: SECTIONS_SECRETARIA
  },
  INVIMA: {
    title: 'Acta de Asesoría para INVIMA',
    sections: SECTIONS_INVIMA
  }
};

/**
 * Backward compatibility helper
 * @deprecated Use DIAGNOSTIC_CONFIG instead
 */
export const SECTIONS = SECTIONS_INVIMA;
