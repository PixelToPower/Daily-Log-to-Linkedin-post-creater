let save_daily_log = JSON.parse(localStorage.getItem("Logs"));
if (save_daily_log === null) {
    save_daily_log = []
}

let stored_logs = document.getElementById("logs-store")


function show_logs() {

    let empty_old_data = document.getElementById("logs-store")
    empty_old_data.innerHTML = ""
    let save_daily_logl = save_daily_log.length
    console.log(save_daily_logl)

    for (let i = 0; i < save_daily_logl; i++) {
        let entered_log = ("<div class='log_item'>" + "<div class='day-adjust'> DAY:"+[i + 1] + "</div>" + "<div class= 'text-collapsed'>" +save_daily_log[i].daily_log_save + "</div>" + "<div class='date-adjust' > DATE:"+ save_daily_log[i].log_date + "</div>" + "<span class='toggle-btn' data-index='"+ i +"'>...show more</span>" + "<button class = 'edit-btn' data-index = '" + i + "'  >edit</button>" + "<button class = 'Delete-btn' data-index = '" + i + "'  >Delete</button>" + "</div>" + "<br><br>" )
        stored_logs.innerHTML += entered_log
        console.log(stored_logs)

    }

}

stored_logs.addEventListener("click" , (event)=>{
    if(event.target.classList.contains('Delete-btn')){
        let index_no = Number(event.target.dataset.index)
        save_daily_log.splice(index_no , 1)
        localStorage.setItem("Logs",JSON.stringify(save_daily_log))
        show_logs()
        console.log(save_daily_log)
    }

    if(event.target.classList.contains('toggle-btn')){
        let show_no = event.target.closest(".log_item")
        console.log(show_no)
        let textspan = show_no.querySelector(".text-collapsed , .text-expanded")
        console.log(textspan)
        textspan.classList.toggle("text-expanded")
        if(textspan.classList.contains("text-expanded")){
            event.target.textContent = "...show less"
        }
        else{
            event.target.textContent = "...show more"
        }
    }
})


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
