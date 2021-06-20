const axios = require('axios')

const scrapyJS = require('./scrapy')
const fs = require("fs")
const mongodb = require('mongodb')

const MongoClient = mongodb.MongoClient


const DataGenrator = function (connectionURL = 'mongodb://127.0.0.1:27017', {
    databaseName = 'media',
    url = "https://api.themoviedb.org/3/movie/popular?api_key=3d97e93f74df6d3dd759d238a7b8564c&language=en-US",
    page = 313,
    lastPageNo
} = {}) {

    let db;
    let spider = scrapyJS("", 1, 1, options = {
        nameSelector: 'div.content > div > p',
        downloadLinkSelector: "div.content > *",
        mainPageLinkSelector: 'div.title > h2 > a',
        notFoundSelector: "div.box > div.title > h2",
        maxThreads: 8
    });

    spider.on("crawled", (data) => {
        // console.log('from search')
        // console.log(data)
        return "found return"
    })
    spider.on("error", error => {
        console.log(error)
        if (error.fromSinglePageCrawler) {
            fs.appendFileSync('./error.txt', error.url + "\n", function (err) {
                if (err) throw err;
            })
        }
    })


    async function fetchMovieData(id) {



        let { data } = await axios.get(`https://api.themoviedb.org/3/movie/${id}?api_key=3d97e93f74df6d3dd759d238a7b8564c&language=en-US&append_to_response=videos`)
        let movie_name = data.title + " " + new Date(data.release_date).getFullYear()

        movie_name = movie_name.replaceAll(/[:().]/g, "")
        let original_name = movie_name
        console.log(id, "title:", movie_name, "original_title:", data.original_title)
        try {
            movie_name = new RegExp(movie_name, 'i')
        } catch (error) {
            console.log('regx error')
        }
        finally {
            let dbData = await db.collection("movies").findOne({ movie_name: movie_name })

            if (!dbData) {
                movie_name = data.original_title.replaceAll(/[:().']/g, "") + " " + new Date(data.release_date).getFullYear()
                try {
                    movie_name = new RegExp(movie_name, 'i')
                } catch (error) {
                    console.log('regx error')
                } finally {
                    console.log(movie_name)
                    dbData = await db.collection("movies").findOne({ movie_name: movie_name })
                }

            }

            if (!dbData) {
                dbData = await spider.search(original_name, true)
                if (dbData) await db.collection("movies").insertOne(dbData);
            }

            if (dbData) {
                data.download_links = dbData.download_links
                const imgPath = 'https://image.tmdb.org/t/p/w500'
                data.backdrop_path = imgPath + data.backdrop_path
                data.poster_path = imgPath + data.poster_path
                await db.collection("movie").insertOne(data)
                console.log('inserted')
            }
        }








    }

    async function moviesData(data) {
        for (let index = 0; index < data.length; index++) {
            if (data[index].adult) continue;
            await fetchMovieData(data[index].id)
        }
    }


    async function connect() {
        const client = await MongoClient.connect(connectionURL, { useNewUrlParser: true, useUnifiedTopology: true }).catch(err => console.log('failed to connect to database'))
        db = client.db(databaseName)
        console.log('connected')

        return;
    }
    async function genrate() {
        await connect()

        let lastPage;
        do {
            const { data } = await axios.get(url + "&page=" + page)
            await moviesData(data.results)
            console.log(page)
            page++
            lastPage = lastPageNo || data.total_pages
        } while (page <= lastPage);
        console.log('finished')
    }

    return {
        genrate,
        async search(name) {// for testing
            await connect()
            spider.search(name)
        }
    }
}


module.exports = DataGenrator







