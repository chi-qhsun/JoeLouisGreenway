library(shiny)
library(leaflet)
library(dplyr)
library(googlesheets4)
library(geosphere)


gs4_auth(path = "service-account.json")
sheet_id <- "1U3oG4fOnrMb1XIxnb7yBIVANR2FP2aKQyEaGvn8hIVQ"


ui <- fluidPage(

  tags$head(
    tags$link(rel = "stylesheet", type = "text/css", href = "css.css")
  ),

  sidebarLayout(
    sidebarPanel(
      textInput("residence_zipcode", "Your Zip Code", placeholder = ""),
      selectInput("overall_experience", "Overall Experience",
                  choices = c("", "Excellent", "Good", "Average", "Poor")),
      selectInput("safety", "Did You Feel Safe?",
                  choices = c("", "Very Safe", "Somewhat Safe", "Not Safe")),
      selectInput("accessibility", "Was It Accessible?",
                  choices = c("", "Very Accessible", "Somewhat Accessible", "Not Accessible")),
      selectInput("facilities", "Facilities Rating (e.g., benches, trash cans)",
                  choices = c("", "Excellent", "Good", "Average", "Poor")),
      textAreaInput("suggestions", "Additional Comments", placeholder = "Any other feedback..."),
    ),
    mainPanel(
      p("Click on the map to select a specific location where you encountered an issue or have feedback."),
      leafletOutput("map", height = 400),
      verbatimTextOutput("selected_point"),
      p("If possible, please upload a photo to help illustrate the area or issue."),
      fileInput("photo",label = "",accept = c("image/png", "image/jpeg")),
      uiOutput("photo_display"),
      actionButton("submit", "Submit Feedback", class = "btn-primary")
    )
  )
)


server <- function(input, output, session) {
  selected_point <- reactiveVal(NULL)
  
  output$map <- renderLeaflet({
    leaflet() %>%
      addTiles() %>%
      setView(lng =  -83.1098, lat = 42.3514, zoom = 12.43)
  })
  

  observeEvent(input$map_click, {
    click <- input$map_click
    selected_point(c(click$lat, click$lng))
    output$selected_point <- renderText({
      paste("Selected Point - Latitude:", click$lat, "Longitude:", click$lng)
    })
  })
  

  observeEvent(input$submit, {
    if (!is.null(input$photo)) {
      dir.create("www/uploads", showWarnings = FALSE)
      photo_path <- paste0("uploads/", input$photo$name)
      file.copy(input$photo$datapath, file.path("www", photo_path), overwrite = TRUE)
      
      output$photo_display <- renderUI({
        tags$img(src = photo_path, width = "100%")
      })
    } else {
      output$photo_display <- renderUI({
        "No photo uploaded."
      })
      photo_path <- NA
    }
    
    feedback <- data.frame(
      Timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S", tz = "America/New_York"),
      Residence_Zipcode = ifelse(is.null(input$residence_zipcode), "", input$residence_zipcode),
      Overall_Experience = ifelse(is.null(input$overall_experience), "", input$overall_experience),
      Safety = ifelse(is.null(input$safety), "", input$safety),
      Accessibility = ifelse(is.null(input$accessibility), "", input$accessibility),
      Facilities = ifelse(is.null(input$facilities), "", input$facilities),
      Suggestions = ifelse(is.null(input$suggestions), "", input$suggestions),
      Selected_Point = ifelse(is.null(selected_point()), "", paste(selected_point(), collapse = ", ")),
      Photo_Path = ifelse(is.na(photo_path), "", photo_path)
    )
    
    sheet_append(
      ss = sheet_id,
      data = feedback,
      sheet = "survey"
    )
    

    showModal(modalDialog(
      title = "Feedback Submitted",
      "Thank you for your feedback!",
      easyClose = TRUE
    ))
  })
}

shinyApp(ui = ui, server = server)
