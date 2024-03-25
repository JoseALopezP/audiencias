import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
    headless: false,
    args: ['--start-maximized'] 
});
let [page] = await browser.pages();

export async function getInfoAudiencia(){
    await page.goto('http://10.107.1.52:8092/site/login?urlBack=http%3A%2F%2F10.107.1.52%3A8094%2F')

    await page.setViewport({width: 1280, height: 720});

    await page.type('#loginform-username', '20423341980');

    await page.type('#loginform-password', 'Marzo24');

    await page.click('button[name="login-button"]');

    await page.waitForSelector('.mfp-close')
    await page.click('.mfp-close');

    await page.click('a[href="/audiencia/agenda"]');

    await page.waitForSelector('.fc-content')
    const buttons = await page.waitForSelector('text/FINALIZADA');
    await console.log(buttons)
    for (const button of buttons) {
        console.log(button)
        await button.scrollIntoView();
        await button.click();
        await page.waitForNavigation()
        const info = await page.evaluate(() => {
            // Here you can write your code to extract information from the page
            // For example:
            const title = document.title;
            const content = document.querySelector('a').textContent;
            return { title, content };
        });    
        console.log(info);
        await page.goBack();
        await page.waitForSelector('.mfp-close')
        await page.click('.mfp-close')
        await page.click('a[href="/audiencia/agenda"]');
        await page.waitForSelector('.fc-content')
    }
}

// http://10.107.1.52:8094/audiencia/[%7B%22id%22:%22490f06bb-e50a-419c-9a26-1a58885a393d%22,%22title%22:%22SALA%2010%20(SOLICITADA)%22,%22description%22:%22%20SALA%2010%20-%20SAN%20JUAN%3Cbr%3E%3Cbr%3E%3Cb%3EEstado%3C//b%3E:%20SOLICITADA%3Cbr%3E%3Cbr%3E%3Cb%3EHorario%3C//b%3E:%2009:00%20a%2009:29%3Cbr%3E%3Cbr%3E%3Cb%3ETipos%20de%20Audiencia%3C//b%3E:%20%3Cbr%3ETR/u00c1MITES%20DE%20EJECUCI/u00d3N%3Cbr%3E%3Cbr%3E%3Cb%3EJueces%3C//b%3E:%20%3Cbr%3EREVERENDO,%20LIDIA%3Cbr%3E%3Cbr%3E%3Cb%3ELegajo%3C//b%3E:%20MPF-SJ-01855-2021%22,%22allDay%22:null,%22start%22:%222024-04-04T09:00:00Z%22,%22end%22:%222024-04-04T09:29:00Z%22,%22ranges%22:null,%22dow%22:null,%22url%22:null,%22className%22:null,%22editable%22:null,%22startEditable%22:null,%22durationEditable%22:null,%22source%22:null,%22color%22:null,%22backgroundColor%22:%22?start=2024-02-25&end=2024-04-07&_=1711372744720 
// http://10.107.1.52:8094/audiencia/view/f47d2bcd-c051-44c8-a0df-2cc5d0efffc2?id_sala=a22d10e0-419a-4406-bf00-9b4345eec209
// http://10.107.1.52:8094/site/tareas?config={%22urlApp%22:%22http:\/\/10.107.1.52:8095\/%22,%22id_persona%22:%22416040b6-5b59-4ce7-8cfb-6226b87c5f9d%22,%22rest_component%22:%22tareaRestComponent%22,%22time_check_alerts_tareas%22:60,%22template%22:%22adminlte2%22,%22cssIcons%22:%22fontawesome4%22}