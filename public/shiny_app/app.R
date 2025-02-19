library(shiny)
library(leaflet)
library(dplyr)
library(googlesheets4)
library(geosphere)
library(geojsonsf)

# Google Sheets authentication
gs4_auth(path = "service-account.json")
sheet_id <- "1U3oG4fOnrMb1XIxnb7yBIVANR2FP2aKQyEaGvn8hIVQ"

ui <- fluidPage(
  tags$head(
    tags$link(rel = "stylesheet", type = "text/css", href = "css.css")
  ),
  HTML("
    <header class='head'>
      <div class='logo'>
        <h1>Joe Louis Greenway Feedback</h1>
      </div>
      <nav class='nav'>
        <ul>
          <li><a href='index.html'>Home</a></li>
          <li><a href='map.html'>Map</a></li>
          <li><a href='http://127.0.0.1:3840' target='_blank'>Feedback</a></li>
        </ul>
      </nav>
    </header>
  "),
  sidebarLayout(
    sidebarPanel(
      HTML("<b>🌿 Thank you for sharing your experience on Joe Louis Greenway!</b><br>
            Click on the map to select a location and tell us what you think. Your feedback is valuable and all questions are optional.<br>"),
      hr(),

      # Question 1: Overall Experience
      h4("1 How was your overall experience? (Optional)"),
      selectInput("overall_experience", "",
        choices = c("", "Excellent", "Good", "Average", "Poor"),
        selected = ""
      ),

      # Question 2: Open Feedback
      h4("2 Do you have any additional comments? (Optional)"),
      p("Click on the map to select a specific location where you have feedback."),
      textAreaInput("suggestions", "",
        placeholder = "We appreciate your feedback. Let us know anything you'd like to share...",
        value = ""
      ),
      actionButton("submit", "Submit Feedback", class = "btn-primary")
    ),
    mainPanel(
      leafletOutput("map", height = 600),
      verbatimTextOutput("selected_point")
    )
  )
)

server <- function(input, output, session) {
  selected_point <- reactiveVal(NULL)

  output$map <- renderLeaflet({
    geojson_url <- "https://yidanchangyd.github.io/greenway_map/greenway.geojson"
    greenway_sf <- geojson_sf(geojson_url)

    leaflet() %>%
      addTiles() %>%
      setView(lng = -83.1098, lat = 42.3514, zoom = 12.43) %>%
      addPolylines(data = greenway_sf, color = "#1c857b", weight = 4, opacity = 0.8) %>%
      addLegend("bottomright", colors = "#1c857b", labels = "Joe Louis Greenway", title = "🛤️ Greenway Path")
  })
  observeEvent(input$map_click, {
    click <- input$map_click
    selected_point(c(click$lat, click$lng))
    output$selected_point <- renderText({
      paste("📍 Selected Location - Latitude:", click$lat, "Longitude:", click$lng)
    })
  })

  observeEvent(input$submit, {
    feedback <- data.frame(
      Timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S", tz = "America/New_York"), # Add timestamp
      Overall_Experience = input$overall_experience,
      Suggestions = input$suggestions,
      Selected_Point = ifelse(is.null(selected_point()), "", paste(selected_point(), collapse = ", "))
    )

    sheet_append(
      ss = sheet_id,
      data = feedback,
      sheet = "survey"
    )

    showModal(modalDialog(
      title = "Thank You!",
      "Your feedback has been submitted successfully. We appreciate your input!",
      easyClose = TRUE
    ))
  })
}
shinyApp(ui = ui, server = server)
