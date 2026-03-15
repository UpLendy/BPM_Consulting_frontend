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

export const SECTIONS: Section[] = [
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
