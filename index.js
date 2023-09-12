const puppeteer = require('puppeteer');
const fs = require('fs');

const url = 'http://www.mercadolivre.com.br/';
const searchFor = 'iphone 14';

let count = 1;

const list = [];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  await page.goto(url);

  await page.waitForSelector('.nav-search-input');
  await page.type('.nav-search-input', searchFor);

  await Promise.all([
    page.waitForNavigation(),
    page.click('.nav-search-btn')
  ]);

  const links = await page.$$eval(
    '.ui-search-result__image > a', 
    el => el.map(link => link.href)
  );

  for(const link of links) {
    if(count == 10 ) continue;
    console.log('Página', count);

    await page.goto(link);

    await page.waitForSelector('.ui-pdp-title');

    const title = await page.$eval(
      '.ui-pdp-title', 
      element => element.innerText
    );
    const price = await page.$eval(
      '.andes-money-amount__fraction', 
      element => element.innerText
    );
    const seller = await page.evaluate(() => {
      const el = document.querySelector('.ui-pdp-seller__link-trigger');
      if (!el) return null
      return el.innerText;
    });

    const obj = {};
    obj.title = title;
    obj.price = price;
    (seller ? obj.seller  = seller : '');
    obj.link = link;

    list.push(obj);

    count++;
  };

  console.log(list);

  // Escrevendo dados em um arquivo local
  fs.writeFile('list.json', JSON.stringify(list, null, 2), err => {
    if(err) throw new Error('Oops! Algo deu errado!');

    console.log('Arquivo salvo com sucesso!');
  });

  await page.waitForTimeout(3000);

  // Fechar o browser
  await browser.close();
})();