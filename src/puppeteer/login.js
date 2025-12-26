import puppeteer from 'puppeteer';

const width = 1280;
const height = 720;

const browser = await puppeteer.launch({
    headless: false,
    // 1. Forzamos el tamaño de la VENTANA física
    args: [`--window-size=${width},${height}`],
    // 2. Ajustamos el contenido INTERNO para que coincida
    defaultViewport: {
        width: width,
        height: height
    }
});
let [page] = await browser.pages();

function limpiarYFormatear(textoBruto) {
    if (!textoBruto) return {};

    // Dividimos ÚNICAMENTE por salto de línea
    const lineas = textoBruto
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);

    const resultado = {};
    if (lineas.length === 0) return resultado;

    resultado["titulo"] = lineas[0];

    for (let i = 1; i < lineas.length; i++) {
        const linea = lineas[i];

        if (linea.includes(':')) {
            const partes = linea.split(':');

            // NORMALIZACIÓN DEL ATRIBUTO (ej: "Tipos de Audiencia" -> "tipos_de_audiencia")
            const nombreAtributo = partes[0]
                .trim()
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/\s+/g, '_');

            // Capturamos lo que pueda haber después de los ":" en la misma línea
            let valorEnMismaLinea = partes.slice(1).join(':').trim();

            // Iniciamos el array con el contenido de la misma línea si existe
            let listaDeValores = valorEnMismaLinea !== "" ? [valorEnMismaLinea] : [];

            // ACUMULADOR: Buscamos en las líneas siguientes
            // Mientras la línea siguiente NO tenga ":", es un string completo para el array
            while (i + 1 < lineas.length && !lineas[i + 1].includes(':')) {
                const contenidoLineaNueva = lineas[i + 1].trim();
                listaDeValores.push(contenidoLineaNueva); // Agregamos la línea entera como un string
                i++;
            }

            // Guardamos: Si es un solo valor lo dejamos como string, si son varios como array
            // Forzamos array en "tipos_de_audiencia" y "jueces" por consistencia
            const siempreArray = ['tipos_de_audiencia', 'jueces'];
            if (listaDeValores.length > 1 || siempreArray.includes(nombreAtributo)) {
                resultado[nombreAtributo] = listaDeValores;
            } else {
                resultado[nombreAtributo] = listaDeValores[0] || "";
            }
        }
    }
    return resultado;
}

export async function getInfoAudiencia() {
    const diaABuscar = "26";
    await page.goto('http://10.107.1.184:8092/site/login?urlBack=http%3A%2F%2F10.107.1.184%3A8094%2F')
    await page.type('#loginform-username', '20423341980');

    await page.type('#loginform-password', 'Marzo24');

    await page.click('button[name="login-button"]');

    await page.waitForSelector('a[href="/audiencia/agenda"]', { visible: true });

    await page.click('a[href="/audiencia/agenda"]');
    await page.waitForSelector('button ::-p-text(Día)', { visible: true });
    await page.click('button ::-p-text(Día)');
    const selector = `td.day ::-p-text(${diaABuscar})`;
    await page.waitForSelector(selector, { visible: true });
    await page.click(selector);
    // Target: all <a> tags that are inside a <td>
    const selectorLinks = 'td a';

    // Wait for at least one to be visible
    await page.waitForSelector(selectorLinks, { visible: true });

    // Get all of them
    const links = await page.$$(selectorLinks);
    await page.evaluate(() => {
        document.documentElement.style.overflowY = 'scroll';
        document.body.style.overflowY = 'scroll';
    });
    const resultados = [];

    console.log(`Se encontraron ${links.length} elementos.`);
    for (let i = 0; i < links.length; i++) {
        try {
            const currentLinks = await page.$$(selectorLinks);
            const link = currentLinks[i];
            if (!link) continue;
            await link.scrollIntoView();
            await link.hover();
            const dynamicSelector = 'div.qtip.qtip-default.qtip-pos-tl.qtip-focus';
            await page.waitForSelector(dynamicSelector, { visible: true, timeout: 5000 });
            const info = await page.evaluate((sel) => {
                const element = document.querySelector(sel);
                return element ? element.innerText.trim() : null;
            }, dynamicSelector);
        } catch (error) {
            console.warn(`⚠️ No se pudo obtener info del índice ${i}. Saltando...`);
            resultados.push({ index: i, data: null, status: 'timeout' });
            await page.mouse.move(0, 0);
        }
    }
    for (let i = 0; i < links.length; i++) {
        try {
            const currentLinks = await page.$$(selectorLinks);
            const link = currentLinks[i];
            if (!link) continue;

            // 1. Primer intento de hover y scroll
            await link.scrollIntoView();
            await link.hover();

            const dynamicSelector = 'div.qtip.qtip-default.qtip-focus';

            try {
                // Esperamos con un timeout razonable para detectar si hubo shift
                await page.waitForSelector(dynamicSelector, { visible: true, timeout: 2000 });
            } catch (e) {
                // 2. SI FALLA (posible shift): Re-calculamos posición y re-intentamos hover
                console.log(`Posible shift detectado en índice ${i}, re-intentando hover...`);
                await link.scrollIntoView(); // Re-ajusta el scroll
                await new Promise(r => setTimeout(r, 300)); // Pausa para que el layout se estabilice
                await link.hover(); // Segundo intento de hover

                // Espera definitiva sin timeout
                await page.waitForSelector(dynamicSelector, { visible: true, timeout: 0 });
            }

            // 3. Extracción de datos
            const infoBruta = await page.evaluate((sel) => {
                const element = document.querySelector(sel);
                // innerText es mejor que textContent aquí porque respeta los <br> como saltos de línea
                return element ? element.innerText : null;
            }, dynamicSelector);

            if (infoBruta) {
                const datosLimpios = limpiarYFormatear(infoBruta);
                resultados.push({
                    index: i,
                    ...datosLimpios,
                });
            }
        } catch (error) {
            console.warn(`⚠️ Error crítico en índice ${i}: ${error.message}`);
            resultados.push({ index: i, data: null, status: 'error' });
        }
        await page.mouse.move(0, 0);
        await new Promise(r => setTimeout(r, 10));
    }
    console.log('Datos extraídos:', resultados);
    await browser.close();
}