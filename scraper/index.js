import puppeteer from "puppeteer";
// import { useEffect } from "react";
// import { useSelector } from "react-redux";


const url = 'https://www.exito.com/mercado/frutas-y-verduras'

const main = async () => { 
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    const all_frutas_y_verduras = await page.evaluate(() => {
        const frutas_y_verduras = document.querySelectorAll('article')

        return Array.from(frutas_y_verduras).slice(0,5).map((fruta_o_verdura)=>{
            const nombre = fruta_o_verdura.querySelector('p').innerText
            const precio = fruta_o_verdura.querySelector('.price').innerText
            const imagen = fruta_o_verdura.querySelector('img').src
        })
    })

    await browser.close();

}

main()