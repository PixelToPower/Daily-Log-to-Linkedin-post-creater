let save_daily_log = JSON.parse(localStorage.getItem("Logs"));
if (save_daily_log === null) {
    save_daily_log = []
}




function show_logs() {


    let stored_logs = document.getElementById("logs-store")
    let empty_old_data = document.getElementById("logs-store")
    empty_old_data.innerHTML = ""
    let save_daily_logl = save_daily_log.length
    console.log(save_daily_logl)

    for (let i = 0; i < save_daily_logl; i++) {
        let entered_log = ("Entery :" + "  " + save_daily_log[i].daily_log_save + "        " + "    Date:" + save_daily_log[i].log_date + "<br><br>")

        stored_logs.innerHTML += entered_log
        console.log(stored_logs)

    }




}



document.getElementById("savebtnn").addEventListener("click", (savebtnn) => {
    console.log(savebtnn, "Clicked savebtnn");

    let daily_log_save = document.getElementById("daily-log").value;
    daily_log_save = daily_log_save.trim()
    if (daily_log_save === "") {
        alert("Please enter daily log")
        return
    }

    let log_date = new Date()
    log_date = log_date.toLocaleDateString()
    console.log(log_date)
    console.log(daily_log_save)
    save_daily_log.push({ daily_log_save, log_date })
    console.log(save_daily_log)
    localStorage.setItem("Logs", JSON.stringify(save_daily_log))


    show_logs()

    let empty_textarea = document.getElementById("daily-log");
    empty_textarea.value = "";



})
show_logs()




document.getElementById("selectbtn").addEventListener("click", (selectbtn) => {
    console.log(selectbtn, "clicked selectbtn")

    let select_past_log = document.getElementById("logs-store").value;
    console.log(select_past_log)
})



document.getElementById("copybtn").addEventListener("click", (copybtn) => {
    console.log(copybtn, "clicked copybtn")

    let copy_generated_past_log = document.getElementById("generatedpost").value;
    console.log(copy_generated_past_log)
})




document.getElementById("generatebtn").addEventListener("click", (generatebtn) => {
    console.log(generatebtn, "clicked generatebtn")

})





