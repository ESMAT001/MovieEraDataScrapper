const axios = require('axios')
const mongodb = require('mongodb')

const MongoClient = mongodb.MongoClient


const DataGenrator = function (connectionURL = 'mongodb://127.0.0.1:27017', {
    databaseName = 'media',
    url = "https://api.themoviedb.org/3/movie/popular?api_key=3d97e93f74df6d3dd759d238a7b8564c&language=en-US",
    page = 1,
    lastPageNo
} = {}) {

    let db;

    async function fetchMovieData(id) {
        let { data } = await axios.get(`https://api.themoviedb.org/3/movie/${id}?api_key=3d97e93f74df6d3dd759d238a7b8564c&language=en-US&append_to_response=videos,images`)
        let movie_name = data.title + " " + new Date(data.release_date).getFullYear()
        movie_name = movie_name.replaceAll(/[:().]/g,"")
        console.log(movie_name,id)
        movie_name = new RegExp(movie_name, 'i')
        let dbData = await db.collection("movies").findOne({ movie_name: movie_name })
        console.log(dbData)

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
        genrate
    }
}


module.exports = DataGenrator







// MongoClient.connect(connectionURL, { useNewUrlParser: true, useUnifiedTopology: true }, (error, client) => {
//     if (error) {
//         return console.log('unable to connect to database!')
//     }
//     console.log("Succesfuly connected to the database!")
//     const db = client.db(databaseName);

//     main()
//     // genre()


//     async function main(url = "https://api.themoviedb.org/3/movie/popular?api_key=3d97e93f74df6d3dd759d238a7b8564c&language=en-US&page=1") {

//         const res = await axios.get(url);
//         let data = res.data.results[0]
//         const vidRes = await axios.get(`https://api.themoviedb.org/3/movie/${data.id}/videos?api_key=3d97e93f74df6d3dd759d238a7b8564c`)
//         let videoData = vidRes.data.results
//         for (let index = 0; index < videoData.length; index++) {
//             videoData[index].video_link = `https://www.youtube.com/embed/${videoData[index].key}?autoplay=1&hl=en&fs=1&autohide=1`
//         }
//         data.video = videoData

//         data.backdrop_path = "https://image.tmdb.org/t/p/w500" + data.backdrop_path;
//         data.poster_path = "https://image.tmdb.org/t/p/w500" + data.poster_path;


//         console.log(data)
//     }

//     async function genre() {
//         const res = await axios.get("https://api.themoviedb.org/3/genre/movie/list?api_key=3d97e93f74df6d3dd759d238a7b8564c&language=en-US")
//         const genreData = res.data.genres
//         for (let index = 0; index < genreData.length; index++) {
//             db.collection("genres").insertOne(genreData[index], (error) => {
//                 if (!error) {
//                     console.log('inserted correctly!')
//                 }
//             })
//         }
//     }


//     return
// })











