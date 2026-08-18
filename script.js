// TRAILER MUTE/UNMUTE LOGIC
function toggleMute() {
    const video = document.getElementById('hero-trailer');
    const muteIcon = document.getElementById('mute-icon');

    // Agar mute hai, toh unmute karo aur icon change karo
    if (video.muted) {
        video.muted = false;
        muteIcon.classList.remove('fa-volume-mute');
        muteIcon.classList.add('fa-volume-up');
    } else {
        // Wapas mute karne ke liye
        video.muted = true;
        muteIcon.classList.remove('fa-volume-up');
        muteIcon.classList.add('fa-volume-mute');
    }
}

// THE HACKER LEVEL IMAGE RETRY FUNCTION
function imageRetry(img, originalSrc) {
    if (!img.dataset.retried) {
        img.dataset.retried = "proxy1";
        img.src = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(originalSrc);
    } else if (img.dataset.retried === "proxy1") {
        img.dataset.retried = "failed";
        img.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=400&auto=format&fit=crop';
    }
}

const allData = [
    // --- WEB SERIES (10) ---
    { id: 1, title: "Game of Thrones", genre: "Series", match: "99%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BN2IzYzBiOTQtNGZmMi00NDI5LTgxMzMtN2EzZjA1NjhlOGMxXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_.jpg", desc: "Nine noble families fight for control over the lands of Westeros.", cast: "Emilia Clarke, Kit Harington", trivia: "The Iron Throne is made of actual swords." },
    { id: 2, title: "Breaking Bad", genre: "Series", match: "99%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BYmQ4YWMxYjUtNjZmYi00MDQ1LWFjMzMtMTVkMTgwYTE4NTc5XkEyXkFqcGdeQXVyMTMzNDExODE5._V1_.jpg", desc: "A chemistry teacher turns to manufacturing methamphetamine.", cast: "Bryan Cranston, Aaron Paul", trivia: "Walter White's alias 'Heisenberg' is a nod to a physicist." },
    { id: 3, title: "Better Call Saul", genre: "Series", match: "98%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BZDA4YmE0OTYtMmRmNS00Mzk2LTlhM2MtNjk4NzBjZGE1MmIyXkEyXkFqcGdeQXVyMTMzNDExODE5._V1_.jpg", desc: "The trials of criminal lawyer Jimmy McGill.", cast: "Bob Odenkirk, Rhea Seehorn", trivia: "Saul Goodman stands for 'It's all good, man.'" },
    { id: 4, title: "House of the Dragon", genre: "Series", match: "97%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BMzAxNDY3MTctNDEzNC00Zjc4LTk3NGMtOWUwNzI5NTdlZTIyXkEyXkFqcGdeQXVyMTMzNDExODE5._V1_.jpg", desc: "An internal succession war within House Targaryen.", cast: "Matt Smith, Emma D'Arcy", trivia: "Features more dragons than Game of Thrones." },
    { id: 5, title: "All of Us Are Dead", genre: "Series", match: "95%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BOTY1ZTE2YmUtMGM5OC00NDU4LTg1NGEtZDQ1MjNlYWU5ZWZiXkEyXkFqcGdeQXVyMTEzMTI1Mjk3._V1_.jpg", desc: "Trapped students must escape their high school during a zombie outbreak.", cast: "Park Ji-hu, Yoon Chan-young", trivia: "The school set was built entirely from scratch." },
    { id: 6, title: "Stranger Things", genre: "Series", match: "96%", age: "16+", img: "https://m.media-amazon.com/images/M/MV5BMDZkYmVhNjMtNWU4MC00MDQxLWE3MjYtZGMzZWI1ZjhlOWJmXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg", desc: "A town uncovers a mystery involving terrifying supernatural forces.", cast: "Millie Bobby Brown, Finn Wolfhard", trivia: "The Duffer Brothers were rejected 15 times." },
    { id: 7, title: "Peaky Blinders", genre: "Series", match: "97%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BZjNVZTkwODgtYWU2OC00MTU3LWI2N2EtNTM4YmEyYTRmYWRmXkEyXkFqcGdeQXVyNjk1Njg5NTA@._V1_.jpg", desc: "A gangster family epic set in 1900s England.", cast: "Cillian Murphy, Paul Anderson", trivia: "Cillian Murphy smoked 3000 herbal cigarettes during filming." },
    { id: 8, title: "Money Heist", genre: "Series", match: "96%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BODI0ZTljYTMtODQ1NC00NmI0LTk1YWUtN2FlNDM1MDExMDlhXkEyXkFqcGdeQXVyMTM0NTUzNDIy._V1_.jpg", desc: "An unusual group of robbers attempt the most perfect robbery.", cast: "Úrsula Corberó, Álvaro Morte", trivia: "The Professor's real name is Sergio Marquina." },
    { id: 9, title: "Dark", genre: "Series", match: "94%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BZmY3YmEwNjQtMzg3Yy00ZjIyLWI4ZTUtMWQ4NDI2YWFkMGQ1XkEyXkFqcGdeQXVyMTUzMTg2ODkz._V1_.jpg", desc: "A family saga with a supernatural twist in a German town.", cast: "Louis Hofmann, Karoline Eichhorn", trivia: "Everything is connected." },
    { id: 10, title: "The Boys", genre: "Series", match: "98%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BOTEyNDJhMDAtY2U5ZS00OTMzLTkwODktMjU3MjFkZWVlMGYyXkEyXkFqcGdeQXVyMjkwOTAyMTE@._V1_.jpg", desc: "A group of vigilantes set out to take down corrupt superheroes.", cast: "Karl Urban, Antony Starr", trivia: "Homelander's suit has cooling systems built in." },

    // --- ACTION (10) ---
    { id: 11, title: "John Wick", genre: "Action", match: "98%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BMTU2NjA1ODgzMF5BMl5BanBnXkFtZTgwMTM2MTI4MjE@._V1_.jpg", desc: "An ex-hit-man tracks down the gangsters that killed his dog.", cast: "Keanu Reeves", trivia: "Keanu did 90% of his own stunts." },
    { id: 12, title: "Spider-Man: No Way Home", genre: "Action", match: "97%", age: "13+", img: "https://m.media-amazon.com/images/M/MV5BZWMyYzFjYTYtNTRjZi00YmZkLThlZWUtMGVlZjNhNWIyZWIzXkEyXkFqcGdeQXVyMTEyNzQ1MTk0._V1_.jpg", desc: "Peter asks Doctor Strange for help.", cast: "Tom Holland, Zendaya", trivia: "Brings back multiple generations of Spider-Men." },
    { id: 13, title: "The Batman", genre: "Action", match: "94%", age: "16+", img: "https://m.media-amazon.com/images/M/MV5BMDdmMTBiNTYtMDIzNi00NGVlLWIzMDYtZTk3MTQ3NGQxZGEwXkEyXkFqcGdeQXVyMzMwOTU5MDk@._V1_.jpg", desc: "Batman investigates a sadistic serial killer.", cast: "Robert Pattinson", trivia: "The Batmobile was built from scratch." },
    { id: 14, title: "Avengers: Endgame", genre: "Action", match: "99%", age: "13+", img: "https://m.media-amazon.com/images/M/MV5BMTc5MDE2ODcwNV5BMl5BanBnXkFtZTgwMzI2NzQ2NzM@._V1_.jpg", desc: "The Avengers assemble to reverse Thanos' actions.", cast: "Robert Downey Jr.", trivia: "Highest grossing superhero movie of all time." },
    { id: 15, title: "Gladiator", genre: "Action", match: "96%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BMDliMmNhNDEtODUyOS00MjNlLTgxODItNTNjYjBlNzFkNjZlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg", desc: "A former Roman General seeks vengeance.", cast: "Russell Crowe", trivia: "The Colosseum set was only partially built." },
    { id: 16, title: "Mad Max: Fury Road", genre: "Action", match: "98%", age: "16+", img: "https://m.media-amazon.com/images/M/MV5BN2EwM2I5OWMtMGQyMi00Zjg1LWJkNTctZTdjYTA4OGUwZjMyXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg", desc: "In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler.", cast: "Tom Hardy, Charlize Theron", trivia: "Most of the effects were practical." },
    { id: 17, title: "Die Hard", genre: "Action", match: "95%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BZjRlNDUxZjAtOGQ4ZC00ZTVlLTg0MTItMTUzMjIxMzIyODc5XkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg", desc: "An NYPD officer tries to save his wife and others taken hostage by German terrorists.", cast: "Bruce Willis, Alan Rickman", trivia: "Bruce Willis was paid $5 million, a huge sum at the time." },
    { id: 18, title: "The Dark Knight", genre: "Action", match: "99%", age: "16+", img: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_.jpg", desc: "Batman faces his greatest psychological and physical test.", cast: "Christian Bale, Heath Ledger", trivia: "Heath Ledger designed his own makeup." },
    { id: 19, title: "Terminator 2", genre: "Action", match: "97%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BMGU2NzRmZjUtNDY3Zi00ZmVjLTllNDUtOWNjZWIwZjIwZjVjXkEyXkFqcGdeQXVyNTc2ODIyMzY@._V1_.jpg", desc: "A cyborg is sent back in time to protect John Connor.", cast: "Arnold Schwarzenegger", trivia: "The CGI liquid metal effects were groundbreaking." },
    { id: 20, title: "Top Gun: Maverick", genre: "Action", match: "98%", age: "13+", img: "https://m.media-amazon.com/images/M/MV5BZWYzOGEwNTgtNWU3NS00ZTQ0LWJkNDMtMjc3MTYWZWZhYmU0XkEyXkFqcGdeQXVyMjkwOTAyMTE@._V1_.jpg", desc: "Maverick trains a detachment of graduates for a special assignment.", cast: "Tom Cruise, Miles Teller", trivia: "Actors actually flew in the F-18 jets." },

    // --- SCI-FI (10) ---
    { id: 21, title: "Interstellar", genre: "Sci-Fi", match: "98%", age: "13+", img: "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDItN2IxOS00MTFiLTgzYTMtZWE5NDIwMjJmNGQ1XkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_.jpg", desc: "Explorers travel through a wormhole in space.", cast: "Matthew McConaughey", trivia: "The black hole rendering led to a physics paper." },
    { id: 22, title: "Inception", genre: "Sci-Fi", match: "97%", age: "16+", img: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg", desc: "A thief steals corporate secrets through dream-sharing.", cast: "Leonardo DiCaprio", trivia: "The spinning top ending is deliberately ambiguous." },
    { id: 23, title: "Dune", genre: "Sci-Fi", match: "96%", age: "13+", img: "https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtMzM2NC00MWE4LWE5MmItZGYzYjk2OTdmNzI0XkEyXkFqcGdeQXVyMTMzNDExODE5._V1_.jpg", desc: "A noble family becomes embroiled in a war for control.", cast: "Timothée Chalamet", trivia: "Hans Zimmer spent a week in the desert for inspiration." },
    { id: 24, title: "The Matrix", genre: "Sci-Fi", match: "99%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg", desc: "A computer hacker learns the true nature of his reality.", cast: "Keanu Reeves", trivia: "The 'bullet time' effect was created for this movie." },
    { id: 25, title: "Blade Runner 2049", genre: "Sci-Fi", match: "95%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BNzA1Njg4NzYxOV5BMl5BanBnXkFtZTgwODk5NjU3MzI@._V1_.jpg", desc: "A young blade runner's discovery leads him on a quest.", cast: "Ryan Gosling, Harrison Ford", trivia: "The sets were mostly practical, not green screen." },
    { id: 26, title: "Arrival", genre: "Sci-Fi", match: "94%", age: "13+", img: "https://m.media-amazon.com/images/M/MV5BMTExMzU0ODcxNDheQTJeQWpwZ15BbWU4MDE1OTI4MzAy._V1_.jpg", desc: "A linguist works with the military to communicate with alien lifeforms.", cast: "Amy Adams, Jeremy Renner", trivia: "The alien language was created by a linguist." },
    { id: 27, title: "The Martian", genre: "Sci-Fi", match: "96%", age: "13+", img: "https://m.media-amazon.com/images/M/MV5BMTc2MTQ3MDA1Nl5BMl5BanBnXkFtZTgwODA3OTI4NjE@._V1_.jpg", desc: "An astronaut becomes stranded on Mars.", cast: "Matt Damon, Jessica Chastain", trivia: "NASA consulted extensively on the film." },
    { id: 28, title: "Avatar", genre: "Sci-Fi", match: "93%", age: "13+", img: "https://m.media-amazon.com/images/M/MV5BZDA0OGQxNTItMDZkMC00N2UyLTg3MzMtYTJmNjg3Nzk5MzRiXkEyXkFqcGdeQXVyNDUzOTQ5MjY@._V1_.jpg", desc: "A paraplegic Marine dispatched to the moon Pandora becomes torn between two worlds.", cast: "Sam Worthington, Zoe Saldana", trivia: "The Na'vi language was developed from scratch." },
    { id: 29, title: "Tenet", genre: "Sci-Fi", match: "91%", age: "16+", img: "https://m.media-amazon.com/images/M/MV5BYzg0NGM2NjAtNmIxOC00MDJmLTg5ZmYtYzM0MTE4NWE2NzlhXkEyXkFqcGdeQXVyMTA4NjE0NjEy._V1_.jpg", desc: "Armed with only one word, a man journeys through a twilight world of international espionage.", cast: "John David Washington, Robert Pattinson", trivia: "They actually blew up a real Boeing 747." },
    { id: 30, title: "Gravity", genre: "Sci-Fi", match: "92%", age: "13+", img: "https://m.media-amazon.com/images/M/MV5BNjE5MzYwMzYxMF5BMl5BanBnXkFtZTcwOTk4MTk0OQ@@._V1_.jpg", desc: "Two astronauts work together to survive after an accident leaves them stranded in space.", cast: "Sandra Bullock, George Clooney", trivia: "Bullock trained for 6 months to perform the wire work." },

    // --- HORROR (10) ---
    { id: 31, title: "The Conjuring", genre: "Horror", match: "94%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BMTM3NjA1NDMyMV5BMl5BanBnXkFtZTcwMDQzNDMzOQ@@._V1_.jpg", desc: "Investigators help a family terrorized by a dark presence.", cast: "Vera Farmiga, Patrick Wilson", trivia: "Based on true case files." },
    { id: 32, title: "IT", genre: "Horror", match: "92%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BZDVkZmI0YzAtNzdjYi00ZjRhLThjNWQtNWE5ODNjM2MzMjc5XkEyXkFqcGdeQXVyNjU1NzU3MzE@._V1_.jpg", desc: "Bullied kids band together to destroy a monster.", cast: "Bill Skarsgård", trivia: "Skarsgård's drooling was real." },
    { id: 33, title: "A Quiet Place", genre: "Horror", match: "95%", age: "16+", img: "https://m.media-amazon.com/images/M/MV5BMjI0MDMzNTQ0M15BMl5BanBnXkFtZTgwMTM5NzM3NDM@._V1_.jpg", desc: "A family lives in silence to hide from creatures.", cast: "Emily Blunt, John Krasinski", trivia: "The cast learned American Sign Language." },
    { id: 34, title: "Get Out", genre: "Horror", match: "96%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BMjUxMDQwNjcyNl5BMl5BanBnXkFtZTgwNzcwMzc0MTI@._V1_.jpg", desc: "A visit to a girlfriend's parents turns into terror.", cast: "Daniel Kaluuya", trivia: "Won the Academy Award for Best Original Screenplay." },
    { id: 35, title: "Hereditary", genre: "Horror", match: "93%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BOTU5MDg3OGItOTEzOS00NDQ0LTgxMDAtNjQwZTlkNDkzYWVjXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_.jpg", desc: "A grieving family is haunted by tragic and disturbing occurrences.", cast: "Toni Collette, Alex Wolff", trivia: "The treehouse was built on a soundstage." },
    { id: 36, title: "The Ring", genre: "Horror", match: "90%", age: "16+", img: "https://m.media-amazon.com/images/M/MV5BNDA2NTg2NjE4Ml5BMl5BanBnXkFtZTYwMjYxMDg5._V1_.jpg", desc: "A journalist must investigate a mysterious videotape.", cast: "Naomi Watts", trivia: "The cursed video was shot on real film." },
    { id: 37, title: "Sinister", genre: "Horror", match: "89%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BMjI5MTg1Njg0Ml5BMl5BanBnXkFtZTcwNzg2Mjc4Nw@@._V1_.jpg", desc: "A true-crime writer finds a cache of snuff films hidden in his new home.", cast: "Ethan Hawke", trivia: "Rated as the scariest movie scientifically." },
    { id: 38, title: "Halloween", genre: "Horror", match: "91%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BNTk1MTQ1MjgxOV5BMl5BanBnXkFtZTgwOTg1NTk4NjM@._V1_.jpg", desc: "Laurie Strode comes to her final confrontation with Michael Myers.", cast: "Jamie Lee Curtis", trivia: "The mask is a modified William Shatner mask." },
    { id: 39, title: "Scream", genre: "Horror", match: "92%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BMjA2NjU5MTg5OF5BMl5BanBnXkFtZTgwOTkyMzQxNDI@._V1_.jpg", desc: "A year after her mother's death, a teenage girl is terrorized by a killer.", cast: "Neve Campbell", trivia: "The Ghostface mask was found in an abandoned house." },
    { id: 40, title: "The Exorcist", genre: "Horror", match: "98%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BYzczZWQlMzMtNDNiYy00MTBhLTg3MTYtYWUwY2NjZjg3MjI5XkEyXkFqcGdeQXVyMTU3NTQyMTg@._V1_.jpg", desc: "When a girl is possessed by a mysterious entity, her mother seeks the help of two priests.", cast: "Ellen Burstyn", trivia: "The set was refrigerated to capture real breath." },

    // --- THRILLER (10) ---
    { id: 41, title: "Se7en", genre: "Thriller", match: "97%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BMTQwMDMwNDQ1Ml5BMl5BanBnXkFtZTgwMTcxNTE0MzE@._V1_.jpg", desc: "Two detectives hunt a serial killer who uses the seven deadly sins.", cast: "Brad Pitt, Morgan Freeman", trivia: "The script was highly sought after in Hollywood." },
    { id: 42, title: "Shutter Island", genre: "Thriller", match: "96%", age: "16+", img: "https://m.media-amazon.com/images/M/MV5BYzhiNDkyNzktNTZmYS00ZTBkLTk2MDAtM2U0YjU1MzgxZjgzXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg", desc: "A U.S. Marshal investigates the disappearance of a murderer.", cast: "Leonardo DiCaprio, Mark Ruffalo", trivia: "Scorsese used real psychiatric facilities for reference." },
    { id: 43, title: "Gone Girl", genre: "Thriller", match: "95%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BMTk0MDQ3MzAzOV5BMl5BanBnXkFtZTgwNzU1NzE3MjE@._V1_.jpg", desc: "With his wife's disappearance having become the focus of a circus, a man sees the spotlight turned on him.", cast: "Ben Affleck, Rosamund Pike", trivia: "David Fincher did 50 takes of certain scenes." },
    { id: 44, title: "Fight Club", genre: "Thriller", match: "98%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BNDIzNDU0YzEtYzE5Ni00ZjlkLTk5ZjgtNjM3NWE4YzA3Nzk3XkEyXkFqcGdeQXVyMjUzOTY1NTc@._V1_.jpg", desc: "An insomniac office worker and a devil-may-care soap maker form an underground fight club.", cast: "Brad Pitt, Edward Norton", trivia: "Brad Pitt really chipped his tooth for the role." },
    { id: 45, title: "Prisoners", genre: "Thriller", match: "94%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BMTg0NTIzMzQ1NV5BMl5BanBnXkFtZTgwODI5MzM2MDE@._V1_.jpg", desc: "When Keller Dover's daughter and her friend go missing, he takes matters into his own hands.", cast: "Hugh Jackman, Jake Gyllenhaal", trivia: "The rain was mostly practical effects." },
    { id: 46, title: "Zodiac", genre: "Thriller", match: "93%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BN2UwNDc5NmEtNjVjZS00OTI5LWE5YjctMWM3ZjBiZGYwMGI2XkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg", desc: "Investigators and reporters track the Zodiac Killer in San Francisco.", cast: "Jake Gyllenhaal, Robert Downey Jr.", trivia: "Fincher spent months researching the actual files." },
    { id: 47, title: "Joker", genre: "Thriller", match: "96%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BNGVjNWI4ZGUtNzE0MS00YTJmLWE0ZDctN2ZiYTk2YmI3NTYyXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg", desc: "In Gotham City, mentally troubled comedian Arthur Fleck is disregarded by society.", cast: "Joaquin Phoenix", trivia: "Phoenix lost 52 pounds for the role." },
    { id: 48, title: "Silence of the Lambs", genre: "Thriller", match: "98%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BNjNhZTk0ZmEtNjJhMi00YzFlLWE1YWEtYzM1M2ZmMGMwMTU4XkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg", desc: "A young F.B.I. cadet must receive the help of an incarcerated and manipulative cannibal killer.", cast: "Jodie Foster, Anthony Hopkins", trivia: "Hopkins won an Oscar for just 16 minutes of screen time." },
    { id: 49, title: "The Prestige", genre: "Thriller", match: "95%", age: "16+", img: "https://m.media-amazon.com/images/M/MV5BMjA4NDI0MTIxNV5BMl5BanBnXkFtZTYwNTM0MzY2._V1_.jpg", desc: "Two stage magicians engage in competitive one-upmanship.", cast: "Christian Bale, Hugh Jackman", trivia: "The word 'prestige' means illusion." },
    { id: 50, title: "Memento", genre: "Thriller", match: "96%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BZTcyNjk1MjEtNjRlMC00NTM5LWEvNjExNDA2YzBhYWQ0XkEyXkFqcGdeQXVyMDM2NDM2MQ@@._V1_.jpg", desc: "A man with short-term memory loss attempts to track down his wife's murderer.", cast: "Guy Pearce", trivia: "The film was shot in 25 days." },

    // --- COMEDY (10) ---
    { id: 51, title: "The Hangover", genre: "Comedy", match: "93%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BNGQwZjg5YmYtY2VkNC00NzliLTljYTctNzI1NmF3OGIyMzQ1XkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg", desc: "Three buddies wake up from a bachelor party in Las Vegas with no memory.", cast: "Bradley Cooper, Zach Galifianakis", trivia: "Ed Helms actually is missing a front tooth." },
    { id: 52, title: "Superbad", genre: "Comedy", match: "94%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BMTc0NjIyMjA2OF5BMl5BanBnXkFtZTcwMzcxOTE1MQ@@._V1_.jpg", desc: "Two co-dependent high school seniors are forced to deal with separation anxiety.", cast: "Jonah Hill, Michael Cera", trivia: "Seth Rogen wrote the script when he was 13." },
    { id: 53, title: "Step Brothers", genre: "Comedy", match: "91%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BODViZDg3ZjYtMzhiYS00YTVkLTk4MzktYWUxMTlkYjc1NjdlXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg", desc: "Two aimless middle-aged losers still living at home are forced against their will to become room-mates.", cast: "Will Ferrell, John C. Reilly", trivia: "Mary Steenburgen plays Will Ferrell's mom despite being only 14 years older." },
    { id: 54, title: "Dumb and Dumber", genre: "Comedy", match: "95%", age: "13+", img: "https://m.media-amazon.com/images/M/MV5BZDQwMjNiMTQtY2UwYy00NjhiLTk0ZWEtZWM5NmExYWFlYTZiXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg", desc: "Two good-hearted but incredibly stupid friends take a cross country trip.", cast: "Jim Carrey, Jeff Daniels", trivia: "Jim Carrey chipped his own tooth for the role." },
    { id: 55, title: "Deadpool", genre: "Comedy", match: "97%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BYzE5MjY1ZDgtMTkyNC00MTMyLThhOTEtZGI5MzdjNzQ4M2U4XkEyXkFqcGdeQXVyNTA4NzY1MzY@._V1_.jpg", desc: "A wisecracking mercenary gets experimented on and becomes immortal.", cast: "Ryan Reynolds", trivia: "Ryan Reynolds paid for the writers to be on set." },
    { id: 56, title: "Anchorman", genre: "Comedy", match: "92%", age: "16+", img: "https://m.media-amazon.com/images/M/MV5BMTQ2MzYwMzk5Ml5BMl5BanBnXkFtZTcwOTI4NzUyMw@@._V1_.jpg", desc: "Ron Burgundy is San Diego's top-rated newsman in the male-dominated broadcasting of the 1970s.", cast: "Will Ferrell, Paul Rudd", trivia: "A lot of the dialogue was improvised." },
    { id: 57, title: "Tropic Thunder", genre: "Comedy", match: "90%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BNDAwNDU2MzcwNV5BMl5BanBnXkFtZTcwNDM4NDc2MQ@@._V1_.jpg", desc: "A group of actors shooting a war movie are forced to become the soldiers they are portraying.", cast: "Ben Stiller, Robert Downey Jr.", trivia: "Tom Cruise wore giant prosthetic hands." },
    { id: 58, title: "21 Jump Street", genre: "Comedy", match: "93%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BMTc3NDQ3MzExM15BMl5BanBnXkFtZTcwNzUxNTIyNw@@._V1_.jpg", desc: "A pair of underachieving cops are sent back to a local high school.", cast: "Jonah Hill, Channing Tatum", trivia: "Jonah Hill lost 40 pounds for the role." },
    { id: 59, title: "Mean Girls", genre: "Comedy", match: "95%", age: "13+", img: "https://m.media-amazon.com/images/M/MV5BMjE1MDQ4MjI1OV5BMl5BanBnXkFtZTcwNQxgMzAzMw@@._V1_.jpg", desc: "Cady Heron is a hit with The Plastics, the A-list girl clique at her new school.", cast: "Lindsay Lohan, Rachel McAdams", trivia: "Tina Fey wrote the script based on a parenting book." },
    { id: 60, title: "Ted", genre: "Comedy", match: "91%", age: "18+", img: "https://m.media-amazon.com/images/M/MV5BMTQ1OTU0ODcxMV5BMl5BanBnXkFtZTcwNDAzMTMzOA@@._V1_.jpg", desc: "John Bennett's childhood wish brings his teddy bear friend to life.", cast: "Mark Wahlberg, Seth MacFarlane", trivia: "Seth MacFarlane did the voice acting live on set." }
];

// 10 SEPARATE ARRAYS
const rowTrending = allData.slice().sort(() => 0.5 - Math.random()).slice(0, 15);
const rowTop10 = allData.filter(m => m.match >= "97%").slice(0, 10);
const rowSeries = allData.filter(m => m.genre === "Series");
const rowMovies = allData.filter(m => m.genre !== "Series" && m.genre !== "Comedy").slice(0, 15);
const rowComedy = allData.filter(m => m.genre === "Comedy");
const rowThriller = allData.filter(m => m.genre === "Thriller");
const rowHorror = allData.filter(m => m.genre === "Horror");
const rowAction = allData.filter(m => m.genre === "Action");
const rowSciFi = allData.filter(m => m.genre === "Sci-Fi");
const rowRecommend = allData.slice().sort(() => 0.5 - Math.random()).slice(0, 12);

// CREATE CARD HTML WITH NEW "MOVIE TITLE" BELOW POSTER
function createCardHTML(movie) {
    return `
        <div class="card-wrapper">
            <div class="premium-card" onclick='openModal(${JSON.stringify(movie).replace(/'/g, "&#39;")})'>
                <img class="card-img" src="${movie.img}" alt="${movie.title}" loading="lazy" referrerpolicy="no-referrer" onerror="imageRetry(this, '${movie.img}')">
                <div class="card-details">
                    <div class="icons-row">
                        <div class="icon-circle icon-play"><i class="fas fa-play" style="margin-left:2px;"></i></div>
                        <div class="icon-circle"><i class="fas fa-plus"></i></div>
                        <div class="icon-circle"><i class="far fa-thumbs-up"></i></div>
                        <div class="icon-circle" style="margin-left:auto;"><i class="fas fa-chevron-down"></i></div>
                    </div>
                    <div class="card-stats">
                        <span style="color:#46d369;">${movie.match}</span> &nbsp; 
                        <span style="border:1px solid #777; padding:1px 4px; border-radius:3px;">${movie.age}</span>
                    </div>
                    <div class="card-genres">${movie.genre}</div>
                </div>
            </div>
            <!-- YE RAHA AAPKA TITLE SECTION -->
            <div class="movie-title-display">${movie.title}</div>
        </div>
    `;
}

// RENDER DOM
document.getElementById('row-trending').innerHTML = rowTrending.map(createCardHTML).join('');
document.getElementById('row-top10').innerHTML = rowTop10.map(createCardHTML).join('');
document.getElementById('row-series').innerHTML = rowSeries.map(createCardHTML).join('');
document.getElementById('row-movies').innerHTML = rowMovies.map(createCardHTML).join('');
document.getElementById('row-comedy').innerHTML = rowComedy.map(createCardHTML).join('');
document.getElementById('row-thriller').innerHTML = rowThriller.map(createCardHTML).join('');
document.getElementById('row-horror').innerHTML = rowHorror.map(createCardHTML).join('');
document.getElementById('row-action').innerHTML = rowAction.map(createCardHTML).join('');
document.getElementById('row-scifi').innerHTML = rowSciFi.map(createCardHTML).join('');
document.getElementById('row-recommend').innerHTML = rowRecommend.map(createCardHTML).join('');

// NAVBAR SCROLL EFFECT
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('black-bg');
    } else {
        navbar.classList.remove('black-bg');
    }
});

// X-RAY MODAL
const modal = document.getElementById('movieModal');

function openModal(movie) {
    modal.classList.remove('hidden');
    
    document.getElementById('modal-img').src = movie.img;
    document.getElementById('modal-title').innerText = movie.title;
    document.getElementById('modal-match').innerText = movie.match + " Match";
    document.getElementById('modal-age').innerText = movie.age;
    document.getElementById('modal-genre').innerText = movie.genre;
    document.getElementById('modal-desc').innerText = movie.desc;
    document.getElementById('modal-cast').innerText = movie.cast;
    document.getElementById('modal-trivia').innerText = movie.trivia;

    const recContainer = document.getElementById('rec-container');
    let recommendations = allData.filter(m => m.genre === movie.genre && m.id !== movie.id);
    if (recommendations.length < 8) {
        const extras = allData.filter(m => m.genre !== movie.genre);
        recommendations = [...recommendations, ...extras];
    }
    recommendations = recommendations.slice(0, 10);
    
    recContainer.innerHTML = recommendations.map(rec => `
        <div class="rec-card" onclick='openModal(${JSON.stringify(rec).replace(/'/g, "&#39;")})'>
            <img src="${rec.img}" alt="${rec.title}" referrerpolicy="no-referrer" onerror="imageRetry(this, '${rec.img}')">
            <p>${rec.title}</p>
        </div>
    `).join('');
}

function closeModal() {
    modal.classList.add('hidden');
}

window.onclick = function(event) {
    if (event.target == modal) {
        closeModal();
    }
}
