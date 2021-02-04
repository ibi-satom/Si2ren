# Welcome 
Welcome to the GitHub home page for *Si2ren*: an IBM i2 connector developed by [Satom IT & Learning solutions](https://satom.net/) that transforms from the [Siren Platform](https://siren.io/) to i2 Analyst's Notebook Premium through i2 Connect gateway of i2 Analyze. 
This repository contains example code of Si2ren.

## About IBI: Investigation By Image

## Si2ren: Example code
This example is built over the [Siren's demo data](https://docs.siren.io/siren-platform-user-guide/11.0/getting-started/getting-started-with-demo-data.html). 

## About Siren demo data
Siren's demo data are sample data from a TechCrunch data source collected some years ago, along with a sample of technical articles that were collected online.
It consists of 4 csv file:
 - companies.csv: A list of companies that includes geo-locations and descriptions.

| blog_url | category_code | city | countrycode | deadpooled_date | description | email_address | founded_date | hasstatus | homepage_url | id | label | Geopoint | number_of_employees | one_competitor | overview | phone_number | statecode | url |
|----------|---------------|------|-------------|-----------------|-------------|---------------|--------------|-----------|--------------|----|-------|----------|---------------------|----------------|----------|--------------|-----------|-----|

- investments.csv: An associative table that connects companies to investors with “amounts”, “round code” (for example, seed round, or round A), and the date of the investment.

| companies      | funded_date | funded_month | funded_year | hassourcedescription                                                                                                       | hassourceurl                                                                                                                                          | id                          | investors                    | label                | raised_amount | raised_currency_code | round_code   | shortInvID   |
|----------------|-------------|--------------|-------------|----------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------|------------------------------|----------------------|---------------|----------------------|--------------|--------------|
| company/15five | 1/15/2013   | 1            | 2013        | 15Five Wants Employees To Have A Voice, Raises $1M From Yammer   s David Sacks, 500 Startups, Ben Parr And More To Give It | http://techcrunch.com/2013/01/15/15five-wants-employees-to-have-a-voice-raises-1m-from-yammers-david-sacks-500-startups-ben-parr-and-more-to-give-it/ | company/15five/funding/2217 | person/investor/matt-brezina | Investment in 15Five | 1000000       | USD                  | unattributed | matt-brezina |

- investors.csv: A list of investors.

| companies      | funded_date | funded_month | funded_year | hassourcedescription                                                                                                       | hassourceurl                                                                                                                                          | id                          | investors                    | label                | raised_amount | raised_currency_code | round_code   | shortInvID   |
|----------------|-------------|--------------|-------------|----------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------|------------------------------|----------------------|---------------|----------------------|--------------|--------------|
| company/15five | 1/15/2013   | 1            | 2013        | 15Five Wants Employees To Have A Voice, Raises $1M From Yammer   s David Sacks, 500 Startups, Ben Parr And More To Give It | http://techcrunch.com/2013/01/15/15five-wants-employees-to-have-a-voice-raises-1m-from-yammers-david-sacks-500-startups-ben-parr-and-more-to-give-it/ | company/15five/funding/2217 | person/investor/matt-brezina | Investment in 15Five | 1000000       | USD                  | unattributed | matt-brezina |

- articles.csv: A collection of technical articles. Advanced: Most of the articles mention one or more companies. To extract (or annotate) these mentions, use the Siren NLP capabilities.

| affiliation_name | alias_list | birthplace | blog_feed_url | blog_url | category_code | city    | countrycode | created_at | deadpooled_date | description               | email_address | first_name | founded_month | founded_year | homepage_url          | id                      | investor.category_code | investortype | label  | last_name | number_of_employees | overview                                                                                                                                                                                                                                                                                                                                                                                                                                                        | phone_number | statecode | twitter_username | updated_at | url                                      | web_presence |
|------------------|------------|------------|---------------|----------|---------------|---------|-------------|------------|-----------------|---------------------------|---------------|------------|---------------|--------------|-----------------------|-------------------------|------------------------|--------------|--------|-----------|---------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|-----------|------------------|------------|------------------|--------------|
|                  |            |            |               |          | biotech       | Chicago | USA         |            |                 | Biopharmaceutical company |               |            | 0             | 2013         | http://www.abbvie.com | company/investor/abbvie | biotech                | company      | AbbVie |           |                     | | No number    | IL        |                  |            | http://www.crunchbase.com/company/abbvie |              |      

>>>
Overviews field of the example article document: <p>AbbVie is a global, research-based biopharmaceutical company formed in 2013 following separation from Abbott. The company&#8217;s mission is to use its expertise, dedicated people and unique approach to innovation to develop and market advanced therapies that address some of the world&#8217;s most complex and serious diseases. In 2013, AbbVie employs approximately 21,000 people worldwide and markets medicines in more than 170 countries.</p> 
>>>

## References
- [IBM i2 Enterprise Insight Analysis 2.3.4](https://www.ibm.com/support/knowledgecenter/SSXVXZ_2.3.4/com.ibm.i2.releasenotes.doc/eia.html)
- [THE SIREN TUTORIAL](https://siren.io/getting-started/)
