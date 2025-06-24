# Electricity Price Api Challenge

In this challenge, you will build a Python-based web service that provides electricity
price information based on historical data.

We have uploaded a week's worth of half-hourly electricity prices for each state to an 
S3 bucket. Your task is to create a web API that allows clients to retrieve the
mean electricity price for a specific state.

## The challenge
Your web API should:

* Access the provided data
* Run a web server with at least one endpoint that accepts a ``state`` argument and
calculates the mean price for that state
* This application should be dockerized
* Your submission should include a ``README`` with instructions on how to set up and run
the docker container

## Resources
* You may use any Python version that is not end of life
* You may use any Python web framework that you like
* You may use any additional Python packages/frameworks that you think are appropriate
* You may use any version of Docker that is not end of life
* You are provided the data in the ``data/`` directory, which contains a CSV with three
columns:
    * ``state``: The state for which the model is run
    * ``price``: The price that is modelled
    * ``timestamp``: The start of the time period for which the price is modelled

## What we are assessing

This exercise is intended to assess your ability to:

* Write clean, idiomatic, maintainable Python code
* Build simple and well-structured web applications
* Handle data ingestion and processing
* Follow best practices in testing, structure, and deployment
* Containerize applications for reproducibility and portability

## Submission

You may submit your application in two ways:

1. A link to a public Git repository (e.g. GitHub or GitLab)
2. An email that includes your repository as a zipfile  