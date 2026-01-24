'use client';

import { useState, useEffect } from 'react';
import BaseModal from '@/app/components/modals/BaseModal';
import { Appointment } from '@/app/types';
import { appointmentService } from '@/app/services/appointments/appointmentService';
import { HiCheckCircle } from 'react-icons/hi';

interface VisitRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  readOnly?: boolean;
}

interface SectionItem {
  numeral: string;
  text: string;
}

interface SubSection {
  id: string;
  title: string;
  items: SectionItem[];
}

interface Section {
  id: string;
  title: string;
  subsections: SubSection[];
}

// Mock structure based on screenshots
const SECTIONS: Section[] = [
  {
    id: '1',
    title: '1. EDIFICACIÓN E INSTALACIONES',
    subsections: [
      {
        id: '1.1',
        title: '1.1 Localización y diseño',
        items: [
          { numeral: '1.1', text: 'Estarán ubicados en lugares aislados de cualquier foco de insalubridad que represente riesgos potenciales para la contaminación del alimento. (Art 6)' },
          { numeral: '1.2', text: 'Su funcionamiento no debe poner en riesgo la salud y el bienestar de la comunidad. (Art 6)' },
          { numeral: '1.3', text: 'Sus accesos y alrededores se mantendrán limpios, libres de acumulación de basuras y deberán tener superficies pavimentadas o recubiertas con materiales que faciliten el mantenimiento sanitario... (Art 6)' },
          { numeral: '2.1', text: 'La edificación debe estar diseñada y construida de manera que proteja los ambientes de producción e impida la entrada de polvo, lluvia, suciedades u otros contaminantes... (Art 6)' },
          { numeral: '2.3', text: 'Los diversos ambientes de la edificación deben tener el tamaño adecuado para la instalación, operación y mantenimiento de los equipos... (Art 6)' },
          { numeral: '2.6', text: 'Sus áreas deben ser independientes y separadas físicamente de cualquier tipo de vivienda y no pueden ser utilizadas como dormitorio. (Art 6)' },
          { numeral: '1', text: 'Su funcionamiento no debe poner en riesgo la salud y el bienestar de la comunidad. (Art 32)' },
          { numeral: '2', text: 'Sus áreas deben ser independientes de cualquier tipo de vivienda y no pueden ser utilizadas como dormitorio (Art 32)' },
          { numeral: '3', text: 'Se localizarán en sitios secos, no inundables y en terrenos de fácil drenaje (Art 32)' },
          { numeral: '4', text: 'No se podrán localizar junto a botaderos de basura, pantanos, ciénagas y sitios que puedan ser criaderos de insectos... (Art 32)' },
          { numeral: '6', text: 'Los alrededores se conservarán en perfecto estado de aseo, libres de acumulación de basuras... (Art 32)' },
          { numeral: '7', text: 'Deben estar diseñados y construidos para evitar la presencia de insectos, roedores u otro tipo de plaga (Art 32)' },
          { numeral: '8', text: 'Se prohíbe el acceso de animales y la presencia de personas diferentes a los manipuladores de alimentos. (Art 33)' },
        ]
      },
      {
        id: '1.2',
        title: '1.2 Condiciones de pisos y paredes',
        items: [
           { numeral: '1.1', text: 'Los pisos deben estar construidos con materiales que no generen sustancias o contaminantes tóxicos, resistentes, no porosos... (Art 7)' },
           { numeral: '1.2', text: 'El piso de las áreas húmedas de elaboración debe tener una pendiente mínima de 2% y al menos un drenaje de 10 cm... (Art 7)' },
           { numeral: '1.3', text: 'Cuando el drenaje de las cavas o cuartos fríos de refrigeración o congelación se encuentren en el interior... (Art 7)' },
           { numeral: '1.4', text: 'El sistema de tuberías y drenajes para la conducción y recolección de las aguas residuales, debe tener la capacidad... (Art 6)' },
           { numeral: '2.1', text: 'En las áreas de elaboración y envasado, las paredes deben ser de materiales resistentes, colores claros, impermeables... (Art 6)' },
           { numeral: '2.2', text: 'Las uniones entre las paredes y entre éstas y los pisos, deben estar selladas y tener forma redondeada... (Art 6)' },
           { numeral: '1', text: 'Los pisos deben estar construidos con materiales que no generen sustancias o contaminantes tóxicos... (Art 33)' },
           { numeral: '2', text: 'El piso de las áreas húmedas de elaboración debe tener una pendiente mínima de 2% y al menos un drenaje de 10 cm... (Art 7)' },
           { numeral: '3', text: 'Las paredes deben ser de colores claros, materiales resistentes, impermeables, no absorbentes y de fácil limpieza... (Art 7)' }
        ]
      },
      {
        id: '1.3',
        title: '1.3 Techos, iluminación y ventilación',
        items: [
           { numeral: '3.1', text: 'Los techos deben estar diseñados y construidos de manera que se evite la acumulación de suciedad... (Art 6)' },
           { numeral: '3.2', text: 'En lo posible, no se debe permitir el uso de techos falsos o dobles techos... (Art 6)' },
           { numeral: '3.3', text: 'En el caso de los falsos techos, las láminas utilizadas, deben fijarse de tal manera que se evite su fácil remoción... (Art 6)' },
           { numeral: '4.1', text: 'Las ventanas y otras aberturas en las paredes deben construirse de manera tal que se evite la entrada y acumulación de polvo... (Art 6)' },
           { numeral: '4.2', text: 'Las ventanas que se comuniquen con el ambiente exterior, deben estar diseñadas de tal manera que se evite el ingreso de plagas... (Art 6)' },
           { numeral: '5.1', text: 'Las puertas deben tener superficie lisa, no absorbente, deben ser resistentes y de suficiente amplitud... (Art 6)' },
           { numeral: '5.2', text: 'No deben existir puertas de acceso directo desde el exterior a las áreas de elaboración... (Art 6)' },
           { numeral: '7.1', text: 'Tendrán una adecuada y suficiente iluminación natural o artificial, la cual se obtendrá por medio de ventanas... (Art 6)' },
           { numeral: '7.2', text: 'La iluminación debe ser de la calidad e intensidad adecuada para la ejecución higiénica y efectiva... (Art 6)' },
           { numeral: '7.3', text: 'Las lámparas, accesorios y otros medios de iluminación del establecimiento deben ser del tipo de seguridad... (Art 6)' },
           { numeral: '8.1', text: 'Las áreas de elaboración poseerán sistemas de ventilación directa o indirecta... (Art 6)' },
           { numeral: '8.2', text: 'Los sistemas de ventilación deben filtrar el aire y proyectarse y construirse de manera que el aire no fluya... (Art 6)' },
           { numeral: '4', text: 'Los techos deben estar diseñados de manera que se evite la acumulación de suciedad, la condensación... (Art 33)' }
        ]
      },
      {
        id: '1.4',
        title: '1.4 Instalaciones sanitarias',
        items: [
           { numeral: '6.1', text: 'Deben disponer de instalaciones sanitarias en cantidad suficiente tales como servicios sanitarios y vestidores... (Art 6)' },
           { numeral: '6.2', text: 'Los servicios sanitarios deben mantenerse limpios y proveerse de los recursos requeridos para la higiene personal... (Art 6)' },
           { numeral: '6.3', text: 'Se deben instalar lavamanos con grifos de accionamiento no manual dotados con dispensador de jabón desinfectante... (Art 6)' },
           { numeral: '6.4', text: 'En las proximidades de los lavamanos se deben colocar avisos o advertencias al personal sobre la necesidad de lavarse... (Art 6)' },
           { numeral: '9', text: 'Contarán con servicios sanitarios para el personal que labora en el establecimiento, debidamente dotados... (Art 32)' },
           { numeral: '11', text: 'Contarán con servicio sanitario en cantidad suficiente para uso público, salvo que por limitaciones del espacio físico... (Art 32)' }
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
              title: '2.1 Condiciones de equipos y utensilios',
              items: [
                  { numeral: 'Art 8', text: 'Los equipos y utensilios utilizados en el procesamiento, fabricación, preparación, envasado y expendio de alimentos... (Art 8)'},
                  { numeral: '1', text: 'Los equipos y utensilios empleados en el manejo de alimentos deben estar fabricados con materiales resistentes... (Art 9)'},
                  { numeral: '6', text: 'En los espacios interiores en contacto con el alimento, los equipos no deben poseer piezas o accesorios... (Art 9)'},
                  { numeral: '8', text: 'En lo posible los equipos deben estar diseñados y construidos de manera que se evite el contacto del alimento... (Art 9)'},
                  { numeral: '9', text: 'Las superficies exteriores de los equipos deben estar diseñadas y construidas de manera que faciliten su limpieza... (Art 9)'},
                  { numeral: '2', text: 'La distancia entre los equipos y las paredes perimetrales, columnas u otros elementos de la edificación... (Art 10)'},
                  { numeral: '3', text: 'Los equipos que se utilicen en operaciones críticas para lograr la inocuidad del alimento... (Art 10)'},
                  { numeral: 'Art 34', text: 'Los equipos y utensilios empleados en los restaurantes y establecimientos gastronómicos deben cumplir con las condiciones... (Art 34)'}
              ]
          },
          {
            id: '2.2',
            title: '2.2 Superficies de contacto con el alimento',
            items: [
                { numeral: 'Art 8', text: 'Los equipos y utensilios utilizados en el procesamiento, fabricación, preparación, envasado y expendio... (Art 8)' },
                { numeral: '2', text: 'Resoluciones 683, 4142 Y 4143 de 2012 o las normas que las modifiquen, adicionen o sustituyan. (Art 9)' },
                { numeral: '3', text: 'Todas las superficies de contacto directo con el alimento deben poseer un acabado liso, no poroso, no absorbente... (Art 9)' },
                { numeral: '4', text: 'Todas las superficies de contacto con el alimento deben ser fácilmente accesibles o desmontables para la limpieza... (Art 9)' },
                { numeral: '5', text: 'Los ángulos internos de las superficies de contacto con el alimento deben poseer una curvatura continua y suave... (Art 9)' },
                { numeral: '7', text: 'Las superficies de contacto directo con el alimento no deben recubrirse con pinturas u otro tipo de material... (Art 9)' },
                { numeral: '10', text: 'Superficies lisas, con bordes sin aristas y estar construidas con materiales resistentes, impermeables y de fácil limpieza... (Art 9)' },
                { numeral: 'Art 34', text: 'Los equipos y utensilios empleados en los restaurantes y establecimientos gastronómicos... (Art 34)' },
                { numeral: '8', text: 'El lavado y desinfección de utensilios debe hacerse con agua potable corriente, jabón o detergente y cepillo... (Art 35)' },
                { numeral: '10', text: 'Cuando los establecimientos no cuenten con agua y equipos en cantidad y calidad suficientes para el lavado... (Art 35)' }
            ]
          }
      ]
  },
  {
      id: '3',
      title: '3. PERSONAL MANIPULADOR DE ALIMENTOS',
      subsections: [
          {
              id: '3.1',
              title: '3.1 Estado de salud',
              items: [
                  { numeral: '1', text: 'Contar con una certificación médica en el cual conste la aptitud o no para la manipulación de alimentos... (Art 11)' },
                  { numeral: '2', text: 'Debe efectuarse un reconocimiento médico cada vez que se considere necesario por razones clínicas y epidemiológicas... (Art 11)' },
                  { numeral: '4', text: 'La empresa debe garantizar el cumplimiento y seguimiento a los tratamientos ordenados por el médico... (Art 11)' },
                  { numeral: '5', text: 'La empresa es responsable de tomar las medidas necesarias para que no se permita contaminar los alimentos... (Art 11)' },
                  { numeral: '12', text: 'El personal que presente afecciones de la piel o enfermedad infectocontagiosa debe ser excluido de toda actividad... (Art 14)' },
              ]
          },
          {
              id: '3.2',
              title: '3.2 Reconocimiento médico',
              items: [
                  { numeral: '1', text: 'Contar con una certificación médica en el cual conste la aptitud o no para la manipulación de alimentos... (Art 11)' },
                  { numeral: '2', text: 'Debe efectuarse un reconocimiento médico cada vez que se considere necesario por razones clínicas y epidemiológicas... (Art 11)' },
                  { numeral: '3', text: 'En todos los casos, como resultado de la valoración médica se debe expedir un certificado en el cual conste la aptitud... (Art 11)' },
                  { numeral: '4', text: 'La empresa debe garantizar el cumplimiento y seguimiento a los tratamientos ordenados por el médico... (Art 11)' },
              ]
          },
          {
              id: '3.3',
              title: '3.3 Prácticas higiénicas',
              items: [
                  { numeral: '1', text: 'Mantener una estricta limpieza e higiene personal y aplicar buenas prácticas higiénicas en sus labores... (Art 14)' },
                  { numeral: '2', text: 'Usar vestimenta de trabajo que cumpla los siguientes requisitos: De color claro que permita visualizar fácilmente su limpieza... (Art 14)' },
                  { numeral: '3', text: 'El manipulador de alimentos no podrá salir e ingresar al establecimiento con la vestimenta de trabajo. (Art 14)' },
                  { numeral: '4', text: 'Lavarse las manos con agua y jabón desinfectante, antes de comenzar su trabajo, cada vez que salga y regrese... (Art 14)' },
                  { numeral: '5', text: 'Mantener el cabello recogido y cubierto totalmente mediante malla, gorro u otro medio efectivo... (Art 14)' },
                  { numeral: '6', text: 'Dependiendo del riesgo de contaminación asociado con el proceso o preparación, será obligatorio el uso de tapabocas... (Art 14)' },
                  { numeral: '7', text: 'Mantener las uñas cortas, limpias y sin esmalte. (Art 14)' },
                  { numeral: '8', text: 'No se permite utilizar reloj, anillos, aretes, joyas u otros accesorios mientras el personal realice sus labores... (Art 14)' },
                  { numeral: '9', text: 'Usar calzado cerrado, de material resistente e impermeable y de tacón bajo. (Art 14)' },
                  { numeral: '10', text: 'De ser necesario el uso de guantes, éstos deben mantenerse limpios, sin roturas o desperfectos... (Art 14)' },
                  { numeral: '11', text: 'No está permitido comer, beber o masticar cualquier objeto o producto, como tampoco fumar o escupir... (Art 14)' },
                  { numeral: '13', text: 'Los manipuladores no deben sentarse, acostarse, inclinarse o similares en el pasto, andenes o lugares... (Art 14)' },
                  { numeral: '14', text: 'Los visitantes a los establecimientos o plantas deben cumplir estrictamente todas las prácticas de higiene... (Art 14)' },
                  { numeral: 'Art 36', text: 'El propietario, la administración del establecimiento y el personal que labore como manipulador de alimentos... (Art 36)' },
                  { numeral: '5', text: 'El personal que está directamente vinculado a la preparación o servido de los alimentos no debe manipular dinero... (Art 35)' },
                  { numeral: '7', text: 'El servido de los alimentos debe hacerse con utensilios (pinzas, cucharas, etc.) según sea el tipo de alimento... (Art 35)' }
              ]
          },
          {
              id: '3.4',
              title: '3.4 Educación y capacitación',
              items: [
                   { numeral: 'Art 12', text: 'Todas las personas que realizan actividades de manipulación de alimentos deben tener formación en educación sanitaria... (Art 12)' },
                   { numeral: 'Art 13', text: 'El plan de capacitación debe contener, al menos, los siguientes aspectos: Metodología, duración, docentes... (Art 13)' },
                   { numeral: 'Art 36', text: 'El propietario, la administración del establecimiento y el personal que labore como manipulador de alimentos... (Art 36)' }
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
               title: '4.1 Control de materias primas',
               items: [
                   { numeral: 'Art 89', text: 'Los productos de la pesca se descargarán y transportarán al área del proceso lo más rápido posible... (Dec 561- Art 89)' },
                   { numeral: '1', text: 'La recepción de materias primas debe realizarse en condiciones que eviten su contaminación... (Art 16)' },
                   { numeral: '3', text: 'Las materias primas e insumos deben ser inspeccionados previo al uso, clasificados y sometidos a análisis... (Art 16)' },
                   { numeral: '4', text: 'Las materias primas se someterán a la limpieza con agua potable u otro medio adecuado de ser requerido... (Art 16)' },
                   { numeral: '5', text: 'Las materias primas conservadas por congelación que requieren ser descongeladas previo al uso... (Art 16)' },
                   { numeral: '1', text: 'El recibo de insumos e ingredientes para la preparación y servido de alimentos se hará en un lugar limpio... (Art 35)' },
                   { numeral: '2', text: 'Los alimentos o materias primas crudos, tales como, hortalizas, frutas, carnes y productos hidrobiológicos... (Art 35)' },
                   { numeral: '3', text: 'Las hortalizas y frutas que se consuman deben someterse a lavado y desinfección con sustancias autorizadas... (Art 35)' },
                   { numeral: 'Res', text: 'Resolución 5109 de 2005 - Resolución 1506 de 2011- Resolución 683, 4142 y 4143 de 2012' }
               ]
          },
          {
               id: '4.2',
               title: '4.2 Prevención de la contaminación cruzada',
               items: [
                   { numeral: '7', text: 'Los depósitos de materias primas y productos terminados ocuparán espacios independientes... (Art 16)' },
                   { numeral: '7', text: 'Cuando en los procesos de fabricación se requiera el uso de hielo en contacto con los alimentos... (Art 18)' },
                   { numeral: '5', text: 'Todo equipo y utensilio que haya entrado en contacto con materias primas o con material contaminado... (Art 20)' },
                   { numeral: '4', text: 'Los alimentos perecederos, tales como, leche y sus derivados, carne y preparados, productos de la pesca... (Art 35)' }
               ]
          },
          {
              id: '4.3',
               title: '4.3 Manejo de temperaturas',
               items: [
                   { numeral: 'Art 293', text: 'Sólo se permitirá la cocción de alimentos por contacto directo con la llama, cuando en dicha operación no se produzca contaminación... (Ley 9 de 1979- Art 293)' },
                   { numeral: 'Art 425', text: 'Una vez descongelado el alimento o la bebida no se permitirá su recongelación, ni su refrigeración. (Ley 9 de 1979- Art 425)' },
                   { numeral: '3.1', text: 'Mantener los alimentos a temperaturas de refrigeración no mayores de 4°C +/- 2°C. (Art 18)' },
                   { numeral: '3.2', text: 'Mantener el alimento en estado congelado. (Art 18)' },
                   { numeral: '3.3', text: 'Mantener el alimento caliente a temperaturas mayores de 60°C (140°F). (Art 18)' },
                   { numeral: '8', text: 'Las operaciones de fabricación deben realizarse en forma secuencial y continua para que no se produzcan retrasos... (Art 18)' },
               ]
          },
          {
               id: '4.4',
               title: '4.4 Condiciones de almacenamiento',
               items: [
                   { numeral: 'Art 16', text: 'Las materias primas conservadas por congelación que requieren ser descongeladas previo al uso... (Resolución 683 de 2012 - Art 16)' },
                   { numeral: '5', text: 'Las materias primas e insumos que requieren ser almacenadas antes de entrar a las etapas de proceso... (Art 16)' },
                   { numeral: '6', text: 'eviten su contaminación y alteración... (Art 16)' },
                   { numeral: '9', text: 'Se prohíbe el almacenamiento de sustancias peligrosas en la cocina, en las áreas de preparación de los alimentos... (Art 33)' },
               ]
          }
      ]
  },
  {
      id: '5',
      title: '5. SANEAMIENTO',
      subsections: [
          {
              id: '5.1',
              title: '5.1 Suministro y calidad de agua potable',
              items: [
                  { numeral: '3.1', text: 'El agua que se utilice debe ser de calidad potable y cumplir con las normas vigentes establecidas por el Ministerio de Salud... (Art 6)' },
                  { numeral: '3.2', text: 'Se debe disponer de agua potable a la temperatura y presión requeridas en las diferentes actividades... (Art 6)' },
                  { numeral: '3.3', text: 'Solamente se permite el uso de agua no potable, cuando la misma no ocasione riesgos de contaminación del alimento... (Art 6)' },
                  { numeral: '3.5.1', text: 'Los pisos, paredes y tapas deben estar construidos con materiales que no generen sustancias o contaminantes tóxicos, deben ser resistentes... (Art 6)' },
                  { numeral: '3.5.2', text: 'Debe ser de fácil acceso para limpieza y desinfección periódica según lo establecido en el plan de saneamiento. (Art 6)' },
                  { numeral: '3.5.3', text: 'Debe garantizar protección total contra el acceso de animales, cuerpos extraños o contaminación por aguas lluvias. (Art 6)' },
                  { numeral: '4', text: 'Abastecimiento o suministro de agua potable. Todos los establecimientos de que trata la presente resolución deben tener documentado el proceso... (Art 26)' },
                  { numeral: '8', text: 'Deben disponer de suficiente abastecimiento de agua potable (Art 32)' },
              ]
          },
          {
              id: '5.2',
              title: '5.2 Residuos Líquidos',
              items: [
                  { numeral: '4.1', text: 'Dispondrán de sistemas sanitarios adecuados para la recolección, el tratamiento y la disposición de aguas residuales... (Res. 2115 de 2007- Art 9)' },
                  { numeral: '4.2', text: 'El manejo de residuos líquidos dentro del establecimiento debe realizarse de manera que impida la contaminación del alimento... (Res. 2115 de 2007- Art 9)' },
                  { numeral: '5', text: 'El manejo de residuos líquidos debe realizarse de manera que impida la contaminación del alimento o de las superficies... (Art 32)' },
                  { numeral: '10', text: 'Deben tener sistemas sanitarios adecuados, para la disposición de aguas servidas y excretas. (Art 32)' },
              ]
          },
          {
               id: '5.3',
               title: '5.3 Residuos Sólidos',
               items: [
                   { numeral: '5.1', text: 'Los residuos sólidos que se generen deben ser ubicados de manera tal que no representen riesgo de contaminación al alimento... ' },
                   { numeral: '5.2', text: 'Los residuos sólidos deben ser removidos frecuentemente de las áreas de producción y disponerse de manera que se elimine... ' },
                   { numeral: '5.3', text: 'El establecimiento debe estar dotado de un sistema de recolección y almacenamiento de residuos sólidos que impida el acceso... ' },
                   { numeral: '5', text: 'Los residuos sólidos deben ser removidos frecuentemente del área de preparación de los alimentos y disponerse de manera que se elimine... (Art 33)' },
                   { numeral: '6', text: 'Deben disponerse de suficientes, adecuados y bien ubicados recipientes así como de locales e instalaciones si es del caso... (Art 33)' },
                   { numeral: '7', text: 'Debe disponerse de recipientes de material sanitario para el almacenamiento de desperdicios orgánicos debidamente tapados... (Art 33)' },
                   { numeral: '11', text: 'Los productos devueltos a la empresa por defectos de fabricación, que tengan incidencia sobre la inocuidad y calidad del alimento... (Art 18)' },
               ]
          },
          {
              id: '5.4',
              title: '5.4 Control Integral de plagas',
              items: [
                  { numeral: '3', text: 'Control de plagas. Las plagas deben ser objeto de un programa de control específico, el cual debe involucrar el concepto de control integral... (Art 26)' },
              ]
          },
          {
              id: '5.5',
              title: '5.5 Limpieza y desinfección de áreas, equipos y utensilios',
              items: [
                  { numeral: '6.5', text: 'Cuando se requiera, las áreas de elaboración deben disponer de sistemas adecuados para la limpieza y desinfección de equipos y utensilios... (Art 6)' },
                  { numeral: '1', text: 'Limpieza y desinfección. Los procedimientos de limpieza y desinfección deben satisfacer las necesidades particulares del proceso... (Art 26)' },
              ]
          },
          {
               id: '5.6',
               title: '5.6 Soportes documentales de saneamiento',
               items: [
                   { numeral: '1', text: 'Lavar y desinfectar sus tanques de almacenamiento y redes, como mínimo cada seis (6) meses. (Dec 1575 de 2007- Art 10)' },
                   { numeral: '2', text: 'Mantener en adecuadas condiciones de operación la acometida y las redes internas domiciliarias para preservar la calidad del agua...' },
                   { numeral: '3', text: 'En edificios públicos y privados, conjuntos habitacionales, fábricas de alimentos, hospitales, hoteles, colegios, cárceles...' },
                   { numeral: '1', text: '. Toda persona natural o jurídica propietaria del establecimiento que fabrique, procese, envase... debe implantar y desarrollar un Plan de Saneamiento... (Art 26)' },
               ]
          }
      ]
  }
];

export default function VisitRegistrationModal({
  isOpen,
  onClose,
  appointment,
  readOnly = false
}: VisitRegistrationModalProps) {
  // State for form data: { [subsectionId]: { q1: string, hallazgos: string } }
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingLastVisit, setIsLoadingLastVisit] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load user info and fetch visit data (last visit if editing, current if read-only)
  useEffect(() => {
    const init = async () => {
      // Load user
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          setCurrentUser(JSON.parse(userStr));
        } catch (e) {
          console.error(e);
        }
      }

      if (isOpen) {
        try {
          setIsLoadingLastVisit(true);
          
          if (readOnly) {
            console.log('DEBUG - VisitRegistrationModal [ReadOnly]: Loading evaluation for:', appointment.id);
            const response = await appointmentService.getVisitEvaluation(appointment.id);
            console.log('DEBUG - API Response:', response);
            
            // Extract from any level (Backend sometimes returns { success, data: { ... } } or just { ... })
            const root = response?.data || response;
            
            // Detailed check for formData
            const foundFormData = root?.formData || root?.data?.formData;
            
            if (foundFormData) {
              setFormData(foundFormData);
              console.log('DEBUG - Full Evaluation Loaded');
            } else {
              console.warn('DEBUG - Evaluation is LIMITED. No formData provided by Backend for this role.');
              // We keep formData empty so it shows "Sin hallazgos" or empty fields correctly
            }
          } else {
            // 1. Try to load CURRENT appointment evaluation (to see if it was already partially filled)
            console.log('DEBUG - VisitRegistrationModal [Edit]: Checking for existing data in current appointment:', appointment.id);
            const currentEvalRes = await appointmentService.getVisitEvaluation(appointment.id);
            const currentRoot = currentEvalRes?.data || currentEvalRes;
            const currentFormData = currentRoot?.formData || currentRoot?.data?.formData;

            if (currentFormData && Object.keys(currentFormData).length > 0) {
              console.log('DEBUG - VisitRegistrationModal [Edit]: Resuming existing evaluation data');
              setFormData(currentFormData);
            } else {
              // 2. FALLBACK to previous visit if current is empty
              console.log('DEBUG - VisitRegistrationModal [Edit]: Current evaluation is empty. Fetching last visit as baseline.');
              const response = await appointmentService.getAppointmentById(appointment.id);
              const fullApt = (response as any).data || response;
              const foundCompanyId = fullApt?.empresaId || fullApt?.empresa_id || fullApt?.companyId;
              
              if (foundCompanyId) {
                const lastApt = await appointmentService.getLastAppointmentByCompany(foundCompanyId);
                if (lastApt && lastApt.id !== appointment.id) {
                  const evalRes = await appointmentService.getVisitEvaluation(lastApt.id);
                  const lastRoot = evalRes?.data || evalRes;
                  const prevFormData = lastRoot?.formData || lastRoot?.data?.formData;
                  if (prevFormData) {
                    console.log('DEBUG - VisitRegistrationModal [Edit]: Loaded baseline from last visit:', lastApt.id);
                    setFormData(prevFormData);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('VisitRegistrationModal: Error loading visit data:', error);
        } finally {
          setIsLoadingLastVisit(false);
        }
      }
    };

    if (isOpen) {
      init();
    }
  }, [isOpen, appointment.id, readOnly]); // Added readOnly to dependency array

  const handleScoreChange = (subsectionId: string, score: 'A' | 'AR' | 'I') => {
    const numericScore = score === 'A' ? "2" : score === 'AR' ? "1" : "0";
    setFormData(prev => ({
      ...prev,
      [subsectionId]: { ...prev[subsectionId], q1: numericScore }
    }));
  };

  const handleFindingsChange = (subsectionId: string, findings: string) => {
    setFormData(prev => ({
      ...prev,
      [subsectionId]: { ...prev[subsectionId], hallazgos: findings }
    }));
  };

  const getScoreLabel = (scoreValue: string) => {
    if (scoreValue === "2") return 'A';
    if (scoreValue === "1") return 'AR';
    if (scoreValue === "0") return 'I';
    return '';
  };

  const calculateTotalSuccessRate = () => {
    const totalSubsections = SECTIONS.reduce((acc, section) => acc + section.subsections.length, 0);
    const maxPossiblePoints = totalSubsections * 2;
    
    let currentPoints = 0;
    Object.values(formData).forEach((val: any) => {
      if (val.q1) {
        currentPoints += parseInt(val.q1);
      }
    });

    return maxPossiblePoints > 0 ? (currentPoints / maxPossiblePoints) * 100 : 0;
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      const successRate = calculateTotalSuccessRate();
      
      const payload = {
        successRate: Math.round(successRate),
        formData: formData
      };
      
      const response = await appointmentService.saveVisitRecord(appointment.id, payload);

      if (response.success) {
        setIsSuccess(true);
        // Esperamos un momento para que el usuario vea el éxito antes de cerrar
        setTimeout(() => {
          setIsSuccess(false);
          setShowConfirmation(false);
          onClose();
        }, 2000);
      } else {
        setSaveError(response.error || 'Error al guardar el registro');
      }
    } catch (error) {
      console.error(error);
      setSaveError('Ocurrió un error inesperado al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="ACTA DE ASESORIA PARA ACOMPAÑAMIENTO"
      size="xl" 
    >
      <div className="max-h-[85vh] overflow-y-auto pr-2 pb-8">
        {/* Header Metadata */}
        <div className="bg-gray-100 p-4 rounded-lg mb-6 text-sm border border-gray-400">
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               <div>
                   <span className="block text-gray-700 text-xs font-black uppercase">Fecha</span>
                   <span className="font-black text-black">
                       {new Date(appointment.date).toLocaleDateString()}
                   </span>
               </div>
                <div>
                   <span className="block text-gray-700 text-xs font-black uppercase">Empresa</span>
                   <span className="font-black text-black">
                     {appointment.companyName || (appointment as any).company?.name || (appointment as any).company_name || '...'}
                   </span>
                </div>
                <div>
                   <span className="block text-gray-700 text-xs font-black uppercase">Municipio</span>
                   <span className="font-black text-black">{appointment.location || (appointment as any).company?.city || 'Manizales'}</span>
                </div>
                <div>
                   <span className="block text-gray-800 text-xs font-black uppercase">
                     {readOnly ? '% Cumplimiento Visita' : '% Cumplimiento Última Visita'}
                   </span>
                   <span className="font-black text-blue-900 text-xl">{calculateTotalSuccessRate().toFixed(1)}%</span>
                </div>
           </div>
           {isLoadingLastVisit && (
             <div className="mt-2 text-xs text-blue-800 font-black flex items-center gap-2">
               <div className="animate-spin h-3 w-3 border-2 border-blue-800 border-t-transparent rounded-full"></div>
               RECUPERANDO DATOS HISTÓRICOS...
             </div>
           )}
        </div>

        {/* Form Sections */}
        <div className="space-y-8">
          {SECTIONS.map((section) => (
            <div key={section.id}>
              {/* Section Header */}
              <div className="bg-blue-900 text-white px-4 py-2 text-sm font-black uppercase rounded-t-lg shadow-sm">
                {section.title}
              </div>
              
              <div className="border border-gray-400 rounded-b-lg overflow-hidden shadow-inner">
                 <div className="grid grid-cols-[1fr_50px_50px_50px_60px_35%] bg-gray-200 text-[10px] font-black text-black border-b border-gray-400">
                     <div className="p-2">ASPECTO A EVALUAR</div>
                     <div className="p-2 text-center border-l border-gray-300">A</div>
                     <div className="p-2 text-center border-l border-gray-300">AR</div>
                     <div className="p-2 text-center border-l border-gray-300">I</div>
                     <div className="p-2 text-center border-l border-gray-300">Puntaje</div>
                     <div className="p-2 text-center border-l border-gray-300">Hallazgos</div>
                 </div>

                 {section.subsections.map((sub) => (
                    <div key={sub.id} className="grid grid-cols-[1fr_50px_50px_50px_60px_35%] border-b border-gray-200">
                        {/* LEFT COLUMN: ITEMS LIST */}
                        <div className="border-r border-gray-200">
                            <div className="bg-gray-50 px-3 py-2 text-xs font-bold text-gray-800 border-b border-gray-200">
                                {sub.title}
                            </div>
                            {sub.items.map((item, idx) => (
                                <div key={idx} className="flex border-b last:border-0 border-gray-100 hover:bg-gray-50">
                                    <div className="w-10 p-2 text-[10px] font-bold text-gray-700 border-r border-gray-100 flex items-center justify-center">
                                        {item.numeral}
                                    </div>
                                    <div className="flex-1 p-2 text-[11px] text-gray-900 font-medium leading-relaxed">
                                        {item.text}
                                    </div>
                                </div>
                            ))}
                        </div>

                         {/* RIGHT COLUMNS: SCORING CONTROLS FOR THE BLOCK */}
                        <div className="flex items-center justify-center border-r border-gray-200 bg-white">
                             <input 
                                type="radio" 
                                name={`score-${sub.id}`}
                                checked={formData[sub.id]?.q1 === "2"}
                                onChange={() => handleScoreChange(sub.id, 'A')}
                                disabled={readOnly}
                                className="h-5 w-5 text-green-700 focus:ring-green-500 cursor-pointer border-gray-400 disabled:opacity-75"
                            />
                        </div>
                        <div className="flex items-center justify-center border-r border-gray-200 bg-white">
                             <input 
                                type="radio" 
                                name={`score-${sub.id}`}
                                checked={formData[sub.id]?.q1 === "1"}
                                onChange={() => handleScoreChange(sub.id, 'AR')}
                                disabled={readOnly}
                                className="h-5 w-5 text-yellow-600 focus:ring-yellow-400 cursor-pointer border-gray-400 disabled:opacity-75"
                            />
                        </div>
                        <div className="flex items-center justify-center border-r border-gray-200 bg-white">
                             <input 
                                type="radio" 
                                name={`score-${sub.id}`}
                                checked={formData[sub.id]?.q1 === "0"}
                                onChange={() => handleScoreChange(sub.id, 'I')}
                                disabled={readOnly}
                                className="h-5 w-5 text-red-700 focus:ring-red-500 cursor-pointer border-gray-400 disabled:opacity-75"
                            />
                        </div>
                        <div className="flex items-center justify-center border-r border-gray-200 bg-gray-100 font-black text-base text-black">
                            {formData[sub.id]?.q1 || ''}
                        </div>
                        <div className="p-1 bg-white">
                             <textarea
                                value={formData[sub.id]?.hallazgos || ''}
                                onChange={(e) => handleFindingsChange(sub.id, e.target.value)}
                                disabled={readOnly}
                                className="w-full h-full min-h-[110px] p-2 text-[13px] text-black font-black border-0 bg-transparent focus:ring-0 resize-none placeholder-gray-500 disabled:text-gray-700"
                                placeholder={readOnly ? "SIN HALLAZGOS" : "ESCRIBA AQUÍ LOS HALLAZGOS..."}
                            />
                        </div>
                    </div>
                 ))}
              </div>
            </div>
          ))}
        </div>

        {/* CALIFICACIÓN DEL BLOQUE */}
        <div className="mt-8 border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-100 p-2 text-center font-bold text-xs border-b border-gray-300">
                CALIFICACIÓN DEL BLOQUE (Calculado Automáticamente)
            </div>
            {/* Placeholder for footer calc */}
            <div className="p-4 text-center text-sm text-gray-500 italic">
                La calificación del bloque corresponde al 33% del total del acta...
            </div>
        </div>

         {/* SIGNATURES FOOTER */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-0 border border-gray-500">
            {/* Engineer Info */}
            <div className="border-b md:border-b-0 md:border-r border-gray-500">
                <div className="bg-gray-200 text-center font-bold text-xs py-1 border-b border-gray-500 text-gray-900">
                    INFORMACION DE QUIEN REALIZA LA VISITA
                </div>
                <div className="grid grid-cols-[100px_1fr] text-xs">
                    <div className="p-2 border-r border-b border-gray-500 font-bold bg-gray-100 text-gray-800 uppercase">NOMBRE:</div>
                    <div className="p-2 border-b border-gray-500 uppercase font-bold text-gray-900">
                        {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : ''}
                    </div>
                    
                    <div className="p-2 border-r border-gray-500 font-bold bg-gray-100 text-gray-800 uppercase">CARGO:</div>
                    <div className="p-2 uppercase font-bold text-gray-900">Ingeniero de Alimentos</div>
                </div>
            </div>

            {/* Company Info */}
            <div className="">
                <div className="bg-gray-200 text-center font-bold text-xs py-1 border-b border-gray-500 text-gray-900">
                    INFORMACION DE QUIEN RECIBE LA VISITA
                </div>
                <div className="grid grid-cols-[100px_1fr] text-xs">
                    <div className="p-2 border-r border-b border-gray-500 font-bold bg-gray-100 text-gray-800 uppercase">NOMBRE:</div>
                    <div className="p-2 border-b border-gray-500 uppercase font-bold text-gray-900">
                        {appointment.companyName || '__________________________'}
                    </div>
                    
                    <div className="p-2 border-r border-gray-500 font-bold bg-gray-100 text-gray-800 uppercase">CARGO:</div>
                    <div className="p-2 uppercase font-bold text-gray-900">Persona Encargada</div>
                </div>
            </div>
        </div>
        
        {/* Footer Actions */}
        <div className="mt-8 flex justify-end gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            {readOnly ? (
                <button
                    onClick={onClose}
                    className="px-8 py-2 bg-blue-900 text-white font-bold rounded-lg shadow-md hover:bg-blue-800 transition-all uppercase text-sm"
                >
                    Cerrar Detalle
                </button>
            ) : (
                <>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => setShowConfirmation(true)}
                        disabled={isSaving}
                        className={`px-6 py-2 bg-blue-900 text-white font-medium rounded-lg hover:bg-blue-800 shadow-md ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Revisar y Guardar
                    </button>
                </>
            )}
        </div>

        {/* Confirmation Overlay Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Confirmar Registro de Visita</h3>
                        <p className="text-sm text-gray-500">Revise el resumen de la calificación antes de guardar.</p>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 relative">
                    {/* Success Overlay inside the confirmation modal */}
                    {isSuccess && (
                      <div className="absolute inset-0 z-50 bg-white/95 flex flex-col items-center justify-center animate-fade-in backdrop-blur-sm">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                          <HiCheckCircle className="w-12 h-12" />
                        </div>
                        <h4 className="text-2xl font-black text-green-900 uppercase">¡Guardado con éxito!</h4>
                        <p className="text-green-700 font-medium">El registro se ha procesado correctamente.</p>
                      </div>
                    )}

                    {saveError && (
                      <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl animate-fade-in">
                        <p className="text-sm text-red-700 font-bold">Error: {saveError}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <span className="text-xs text-blue-600 font-bold uppercase block">Puntaje Total</span>
                            <span className="text-3xl font-black text-blue-900">{calculateTotalSuccessRate().toFixed(1)}%</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center flex flex-col justify-center">
                            <span className="text-xs text-gray-500 font-bold uppercase block">Items Evaluados</span>
                            <span className="text-2xl font-bold text-gray-800">
                                {Object.keys(formData).length} / {SECTIONS.reduce((acc, s) => acc + s.subsections.length, 0)}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {SECTIONS.map(section => {
                            const sectionItems = section.subsections.filter(sub => formData[sub.id]);
                            if (sectionItems.length === 0) return null;
                            
                            return (
                                <div key={section.id} className="border border-gray-100 rounded-lg p-3">
                                    <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase">{section.title}</h4>
                                    <div className="space-y-2">
                                        {section.subsections.map(sub => {
                                            const data = formData[sub.id];
                                            if (!data) return null;
                                            return (
                                                <div key={sub.id} className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-700 truncate mr-4">{sub.title}</span>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                            data.q1 === "2" ? 'bg-green-100 text-green-700' :
                                                            data.q1 === "1" ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                            {getScoreLabel(data.q1)} ({data.q1})
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                    <button 
                        onClick={() => setShowConfirmation(false)}
                        className="flex-1 px-4 py-3 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                        Volver a Editar
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 px-4 py-3 bg-blue-900 text-white font-bold rounded-xl hover:bg-blue-800 shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50"
                    >
                        {isSaving ? 'Guardando...' : 'Confirmar y Guardar'}
                    </button>
                </div>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
