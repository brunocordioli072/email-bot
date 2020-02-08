const Main = require('./controller')
const main = new Main();

(async () => {
    // Trying creating -> sending emails 
    main.sendEmail(
        main.createEmail(
            "<p>Oi, tudo bom!</p>",
            "Aqui é o @Nome",
            "Boas Vindas",
            "xxx@xxx.xxx"
        ));

    // Requires back-end :/
    // Getting unread emails from config email
    let storage = main.getUnreadEmailsFromYesterdayAndHaveSubject();
    console.log(storage);
})();
