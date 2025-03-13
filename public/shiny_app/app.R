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
      HTML("<b>🌿 Thank you for sharing your thoughts on Joe Louis Greenway!</b><br>
            Select a location on the map and share your excitement! Your feedback is greatly appreciated.<br>"),
      hr(),

      # Question 1: Open Feedback
      h4("1. Which section of the Joe Louis Greenway excites you the most?"),  
      p("Click on the map and let us know!"),
      textAreaInput("feedback", "",
      placeholder = "We’d love to hear from you! Share your excitement or experiences here...",  
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
      addPolylines(data = greenway_sf, color = "#177b71", weight = 4, opacity = 1) %>%
      addControl(
    HTML('<div style="background: white; 
                  display: flex; align-items: center;">
            <svg width="30" height="5">
              <line x1="0" y1="3" x2="50" y2="2" stroke="rgb(23, 123, 113)" stroke-width="4" style="stroke: rgb(23, 123, 113) !important;"/>
            </svg>
            <span style="margin-left: 8px;">Joe Louis Greenway</span>
          </div>'),
    position = "bottomright"
  )

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
