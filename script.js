let save_daily_log = [];

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
    save_daily_log.push({daily_log_save , log_date})

    console.log(save_daily_log)
    save_daily_logl = save_daily_log.length()
    console.log(save_daily_logl)


    let empty_textarea = document.getElementById("daily-log");
    empty_textarea.value = "";
})
for(let i = 0 ; i <save_daily_logl ; i++){
    console.log("loop runs")
}




let save_past_days_log = document.getElementById("logs-store").value;
console.log(save_past_days_log)



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


