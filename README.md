[![npm version](https://badge.fury.io/js/revenue.svg)](http://badge.fury.io/js/revenue)

Revenue is a tool that gives you a quick summary of your revenue from [Harvest](https://www.getharvest.com/)

# Install

    npm install -g revenue

# Usage

    $ revenue
    Revenue 2015
        Gross sales: 122,000.00 €
        Net sales: 100,000.00 €

    $ revenue -y 2012

    Revenue 2012
        Gross sales: 61,000.00 €
        Net sales: 50,000.00 €

    $ revenue -qy 2014

    Revenue 2014
    Q1  Gross sales: 30,5000.00 €
      Net sales: 25,000.00 €

    Q2  Gross sales: 30,5000.00 €
      Net sales: 25,000.00 €

    Q3  Gross sales: 30,5000.00 €
      Net sales: 25,000.00 €

    Q4  Gross sales: 30,5000.00 €
      Net sales: 25,000.00 €

    TOTAL Gross sales: 122,000.00 €
      Net sales: 100,000.00 €


    $ revenue -q 2 -y 2014

    Revenue 2014
    Q2  Gross sales: 30,5000.00 €
      Net sales: 25,000.00 €


# TODO

* [x] cache
* [ ] locales
* [x] quarters
* [ ] comparisons
* [ ] graphs
* [ ] estimates
