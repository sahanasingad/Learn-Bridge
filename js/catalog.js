"use strict";
/* Learning catalog (activities and exercises), demo mentors, media storage and downloads */
/* ============================================================
   LEARNING CATALOG
   Music: Piano, Guitar, Violin, Drum kit (instrument studio + note/drum drills)
   Speaking: 5 activities with a paragraph and an automatic timer
   Python: 4 activities with a code editor that runs Python and checks answers
   ============================================================ */
const T = (id, cat, emoji, name, level, about, points, ex) => ({ id, cat, emoji, name, level, about, summary: about.split(". ")[0] + ".", points, ex: ex.map((e, i) => ({ id: id + "-" + (i + 1), topicId: id, cat, ...e })) });
const E = (kind, title, desc, extra = {}) => ({ kind, title, desc, ...extra });
const DRILL = (title, desc, drill) => E("Exercise", title, desc, { drill, questions: 10 });
const PLAY = (title, desc, extra = {}) => E("Practice", title, desc, { minutes: 10, ...extra });
const FREE = (inst) => E("Free play", "Free play and record", `Play the ${inst} with your mouse, finger or computer keyboard. Use Record to capture what you play${inst === "drum kit" ? "" : ", Mark to pick notes and play them together"}, and the metronome to keep time.`, { free: true });

const TOPICS = [
  /* ---------------- MUSIC ---------------- */
  T("piano", "music", "🎹", "Piano", "Keys",
    "Learn the piano keyboard from the first notes to chords. You will read notes on the treble staff, find every key by name, build major chords, and play simple melodies with both hands. Play on the virtual piano with your mouse or computer keyboard, record what you play, and send your takes to your mentor.",
    ["The white keys repeat C D E F G A B; C is the white key just left of each group of two black keys.", "Black keys are sharps (♯) and flats (♭): C♯ is the same key as D♭.", "A major chord is a root, a major third (4 semitones up) and a perfect fifth (7 semitones up).", "On the keyboard, the top letter row plays white keys and the number row plays black keys."],
    [FREE("piano"),
     DRILL("Read notes: C, D and E", "A note appears on the treble staff. Play the matching key on the piano.", { type: "read", notes: [60, 62, 64] }),
     DRILL("Read notes: C to G", "Name the notes C to G by playing them on the piano.", { type: "read", notes: [60, 62, 64, 65, 67] }),
     DRILL("Read notes: one octave", "Read any white-key note from middle C up to the next C.", { type: "read", notes: [60, 62, 64, 65, 67, 69, 71, 72] }),
     DRILL("Find the keys: white keys", "A note name appears. Play that key.", { type: "find", pcs: [0, 2, 4, 5, 7, 9, 11] }),
     DRILL("Find the keys: sharps and flats", "Find the black keys by their sharp or flat names.", { type: "find", pcs: [1, 3, 6, 8, 10] }),
     DRILL("Build major chords", "Mark the three keys of the chord, then press Check.", { type: "chord", chords: [0, 5, 7, 2, 9, 4] }),
     PLAY("C major scale, hands separately", "Play C D E F G A B C up and down with the right hand, then the left hand. Use the metronome at 60 bpm. Record your best take and send it."),
     PLAY("Play a simple melody", "Play Twinkle Twinkle Little Star: C C G G A A G, F F E E D D C. Record it on the virtual piano or on a real piano.")]),
  T("guitar", "music", "🎸", "Guitar", "Strings",
    "Get to know the guitar fretboard and the first chords every player needs. You will name notes on each string, find notes quickly, and strum common chords in time. Use the virtual fretboard, strum chords with one tap, record your playing and send it to your mentor.",
    ["Standard tuning from the thickest string: E A D G B E.", "Each fret raises the note by one semitone; fret 12 is the same note an octave higher.", "G, C, D and Em are the four chords behind thousands of songs.", "Change chords slowly and in time before you try to go fast."],
    [FREE("guitar"),
     DRILL("Name the open strings", "An open string is highlighted. Choose its note name.", { type: "name", strings: [0, 1, 2, 3, 4, 5], frets: [0, 0] }),
     DRILL("Name notes: frets 0 to 5", "A dot appears on the fretboard. Choose the note name.", { type: "name", strings: [0, 1, 2, 3, 4, 5], frets: [0, 5], naturals: true }),
     DRILL("Name notes on the low E string", "Name any note from fret 0 to 12 on the thickest string.", { type: "name", strings: [0], frets: [0, 12] }),
     DRILL("Find the note on a string", "Find the named note on the given string and tap it.", { type: "find", strings: [0, 1, 2, 3, 4, 5], frets: [0, 12], naturals: true }),
     PLAY("Strum G, C, D and Em", "Strum each chord four times at 70 bpm: G, C, D, Em. Use the chord buttons or a real guitar. Record and send it."),
     PLAY("One-minute chord changes", "Switch between G and C for one minute with the metronome. Write in your notes how many clean changes you made.")]),
  T("violin", "music", "🎻", "Violin", "Strings",
    "Build a clean, in-tune sound on the violin. You will learn the four open strings, read notes on the staff, and find each note in first position. Play the virtual violin (hold a note to keep the bow moving), record long bows and scales, and send them to your mentor.",
    ["The open strings from lowest are G, D, A and E, each a fifth apart.", "In first position, fingers 1 to 4 play the notes above each open string.", "Keep the bow straight, halfway between the bridge and the fingerboard.", "Check each finger against the open string above it; in-tune notes ring."],
    [FREE("violin"),
     DRILL("Name the open strings", "An open string is highlighted. Choose its note name.", { type: "name", strings: [0, 1, 2, 3], frets: [0, 0] }),
     DRILL("Read notes: first position", "A note appears on the staff. Play it on the violin.", { type: "read", notes: [55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72, 74, 76] }),
     DRILL("Name notes in first position", "A spot on the fingerboard is highlighted. Choose the note name.", { type: "name", strings: [0, 1, 2, 3], frets: [0, 7] }),
     PLAY("Open-string long bows", "Play long, even bows on G, D, A and E, four beats each at 60 bpm. Record it on a real violin or the virtual violin."),
     PLAY("D major scale", "Play D E F♯ G A B C♯ D on the D and A strings, slowly up and down. Record your best take.")]),
  T("drums", "music", "🥁", "Drum kit", "Drums",
    "Learn the parts of the drum kit and play your first grooves in time. You will recognise each drum by its sound, copy short patterns, and play a basic rock beat with the metronome. Tap the pads or use your keyboard, record your groove and send it to your mentor.",
    ["Kick drum on beats 1 and 3, snare on 2 and 4: that is the heart of rock and pop.", "The hi-hat keeps time; count 1 and 2 and 3 and 4 and.", "Toms are for fills; the crash marks the start of a new section.", "Always practise with a metronome, starting slowly."],
    [FREE("drum kit"),
     DRILL("Which drum is it? (5 drums)", "Listen to a sound and tap the drum that made it.", { type: "listen", pads: ["kick", "snare", "hihat", "crash", "tom1"] }),
     DRILL("Which drum is it? (full kit)", "Listen and identify any drum or cymbal in the kit.", { type: "listen", pads: ["kick", "snare", "hihat", "ohat", "tom1", "tom2", "ftom", "crash", "ride"] }),
     DRILL("Copy the pattern: 3 hits", "Listen to three hits, then play them back in the same order.", { type: "copy", len: 3, pads: ["kick", "snare", "hihat", "crash"] }),
     DRILL("Copy the pattern: 5 hits", "Listen to five hits, then play them back in the same order.", { type: "copy", len: 5, pads: ["kick", "snare", "hihat", "tom1", "tom2", "ftom", "crash"] }),
     PLAY("Basic rock beat", "Kick on 1 and 3, snare on 2 and 4, hi-hat on every eighth note, at 80 bpm for one minute. Record it and send it."),
     PLAY("Rock beat with a fill", "Play three bars of the rock beat, then a one-bar fill around the toms, four times. Record and send.")]),

  /* ---------------- PUBLIC SPEAKING & COMMUNICATION ---------------- */
  T("self-intro", "speaking", "👋", "Self introduction", "Speaking",
    "Learn to introduce yourself clearly and confidently in any setting, from a classroom to an interview. You will practise a short structure (who you are, what you do, what you enjoy, what you want next), read a model introduction aloud, and speak within a time limit. The timer starts after a short preparation countdown and stops your recording automatically when time is up.",
    ["Use the Present, Past, Future structure: what you do now, how you got here, where you are going.", "Start with your name and one clear fact; end with one memorable line.", "Smile, look at the listener (or camera), and pause between ideas.", "Keep it within the time limit; practise until it fits."],
    [E("Speech", "30-second introduction", "Introduce yourself in 30 seconds.", { mode: "speak", prep: 10, speak: 30, prompts: ["Introduce yourself: your name, where you are from, what you study or do, one hobby, and one thing you want to learn this year."] }),
     E("Speech", "Read a model introduction aloud", "Read the paragraph aloud clearly, with natural pauses.", { mode: "read", prep: 10, speak: 45, prompts: ["Good morning, everyone. My name is Kavya, and I am a second-year student of computer science. I grew up in a small town near the coast, where I learned to love both books and the sea. Right now I am learning Python and public speaking, because I want to build apps and explain them well. Outside class, I play the guitar and volunteer at our local library. Thank you for listening, and I look forward to working with all of you."] }),
     E("Speech", "Introduce yourself to a panel", "Speak for one minute as if you are meeting an interview panel or a new team.", { mode: "speak", prep: 15, speak: 60, prompts: ["Introduce yourself to an interview panel: education, one achievement, one strength, and why you are interested in this opportunity.", "Introduce yourself to a new team at work or college: your role, your experience, and how you like to work with others."] })]),
  T("presentation", "speaking", "📊", "Presentation skills", "Speaking",
    "Present ideas so that people listen and remember. You will practise strong openings, clear structure with signposts, and confident closings, then give a short timed presentation. Record in audio or video so your mentor can check your voice, pace, body language and use of time.",
    ["Open with a hook: a question, a surprising fact or a short story.", "Tell them what you will cover, cover it in three points, then summarise.", "Use signposts: first, next, finally, to sum up.", "Slow down; a pause before a key point makes it land."],
    [E("Speech", "Open with a hook", "Give only the opening 20 seconds of a talk on the topic shown. Grab attention.", { mode: "speak", prep: 15, speak: 20, prompts: ["Why sleep matters for students", "The future of electric vehicles", "How music helps us learn", "Why everyone should learn to code", "Reducing plastic waste at home"] }),
     E("Speech", "Read a presentation opening aloud", "Read this opening like a presenter: clear, confident and not too fast.", { mode: "read", prep: 10, speak: 45, prompts: ["Imagine starting every morning with a clear mind and a full hour of free time. Sounds impossible? Today I will show you three simple habits that make it possible. First, we will look at how to plan the night before. Next, I will share a two-minute trick to stop checking your phone. Finally, we will build a morning routine that actually lasts. Let us begin."] }),
     E("Speech", "Two-minute mini presentation", "Present on the topic with an opening, three points and a closing.", { mode: "speak", prep: 30, speak: 120, prompts: ["My favourite invention and why", "A place everyone should visit", "One skill that will matter in ten years", "How to study smarter, not harder", "Why teamwork beats talent"] })]),
  T("debate", "speaking", "⚖️", "Debate", "Speaking",
    "Learn to build an argument, support it with reasons and examples, and respond to the other side. You will argue for and against real motions and practise rebuttals under time pressure. The preparation timer gives you a few seconds to think, then the speaking timer records you and stops automatically.",
    ["State your position clearly in the first sentence.", "Use claim, reason, example for every argument.", "In a rebuttal, restate their point fairly, then show why it is weak.", "Finish by telling the judges why your side wins."],
    [E("Speech", "Argue for the motion", "Speak in favour of the motion shown.", { mode: "speak", prep: 30, speak: 60, prompts: ["This house believes homework should be banned", "This house believes social media does more harm than good", "This house would make coding compulsory in schools", "This house believes exams should be replaced by projects", "This house would ban single-use plastics"] }),
     E("Speech", "Argue against the motion", "Speak against the motion shown.", { mode: "speak", prep: 30, speak: 60, prompts: ["This house believes technology makes us less social", "This house would lower the voting age to 16", "This house believes online classes are better than classroom learning", "This house would give every student a free laptop"] }),
     E("Speech", "Rebuttal", "Read the argument, then respond to it and defend the other side.", { mode: "speak", prep: 20, speak: 45, prompts: ["Argument to answer: \"Uniforms should be scrapped because they stop students from expressing themselves.\"", "Argument to answer: \"Video games are a waste of time and should be limited by law.\"", "Argument to answer: \"Learning a second language is pointless now that we have translation apps.\""] })]),
  T("interview", "speaking", "💼", "Interview preparation", "Speaking",
    "Prepare for college, internship and job interviews. You will answer the most common interview questions within a time limit, use the STAR method for experience questions, and record yourself on video to check eye contact and body language. Your mentor reviews each answer and tells you what to improve.",
    ["Answer \"Tell me about yourself\" in under a minute: present, past, future.", "Use STAR for experience questions: Situation, Task, Action, Result.", "Give one real example for every strength you mention.", "Prepare two questions to ask the interviewer."],
    [E("Speech", "Common interview questions", "Answer the question shown. Aim for 45 to 60 seconds.", { mode: "speak", prep: 15, speak: 60, prompts: ["Tell me about yourself.", "Why do you want to join us?", "What are your strengths?", "Where do you see yourself in five years?", "Why should we choose you?"] }),
     E("Speech", "Experience questions with STAR", "Answer using Situation, Task, Action, Result.", { mode: "speak", prep: 30, speak: 90, prompts: ["Describe a time you solved a difficult problem.", "Tell me about a time you worked in a team that disagreed.", "Describe a mistake you made and what you learned.", "Tell me about a goal you set and achieved."] }),
     E("Speech", "Read a model answer aloud", "Read the model answer with confidence, then try your own version.", { mode: "read", prep: 10, speak: 50, prompts: ["In my final year project, our team had two weeks left and our app kept crashing. My task was to find the cause. I added logging, found that we were loading every image at full size, and changed it to load small previews first. The app stopped crashing, loaded three times faster, and we presented on time. I learned to measure a problem before trying to fix it."] })]),
  T("pronunciation", "speaking", "🗣️", "Pronunciation and accent", "Speaking",
    "Speak English clearly so that anyone can understand you. You will read passages aloud, practise tricky sounds with minimal pairs and tongue twisters, and work on word stress. If your browser supports speech recognition, the app shows which words were heard, your accuracy and your speaking speed.",
    ["Clarity matters more than accent; open your mouth and finish each word.", "Practise sound pairs: v and w, th and t, short i and long ee.", "Stress the right syllable: PHOtograph, phoTOgraphy, photoGRAphic.", "Record, listen back, and repeat the words you missed."],
    [E("Speech", "Read the passage aloud", "Read the passage clearly. Speech recognition will mark the words it heard.", { mode: "read", prep: 10, speak: 45, prompts: ["The weather this Thursday was warm and bright, so three of us walked through the park to the theatre. We watched a very funny film about a village that wanted to win a vegetable contest. Afterwards, we thought about which vegetable would win, and we all agreed the giant pumpkin was the best."] }),
     E("Speech", "Tongue twisters", "Say the tongue twister three times, getting faster each time.", { mode: "read", prep: 5, speak: 20, prompts: ["She sells seashells by the seashore.", "Red lorry, yellow lorry, red lorry, yellow lorry.", "Unique New York, you know you need unique New York.", "Three thin thinkers thinking thick thoughts.", "Very well, very well, very well, William."] }),
     E("Speech", "Minimal pairs", "Read each pair slowly and make the two words sound different.", { mode: "read", prep: 5, speak: 30, prompts: ["ship, sheep. fill, feel. live, leave. sit, seat. bit, beat.", "vest, west. vine, wine. very, wary. van, wan. vet, wet.", "thin, tin. three, tree. thank, tank. both, boat. path, part."] }),
     E("Speech", "Word stress", "Read each word with the stress on the correct syllable.", { mode: "read", prep: 5, speak: 30, prompts: ["PHOtograph, phoTOgraphy, photoGRAPHic. ECOnomy, ecoNOMic. deVElop, deVElopment.", "COMfortable, VEgetable, INteresting, DIFFerent, choCOlate, TEMperature."] })]),

  /* ---------------- PYTHON ---------------- */
  T("py-basics", "python", "🔢", "Variables and data types", "Beginner",
    "Start programming in Python by storing information in variables and working with the main data types: whole numbers (int), decimals (float), text (str) and True/False values (bool). You will type code in the editor, run it, read the output and fix any errors the program shows. Press Check to test your answer automatically.",
    ["A variable is a name that points to a value: age = 15.", "type(x) tells you the data type of x.", "Convert between types with int(), float() and str().", "f-strings build text from values: f\"{name} is {age}\"."],
    [E("Playground", "Code playground", "Write and run any Python code.", { free: true, starter: "# Write any Python code and press Run (or Ctrl+Enter)\nname = \"Asha\"\nprint(\"Hello,\", name)\n" }),
     E("Problem", "Create four variables", "Create name (a str), age (an int), height (a float) and is_student (a bool). Print each one with its type.",
       { starter: "# Create the four variables below\nname = \nage = \nheight = \nis_student = \n\nprint(name, type(name))\n",
         check: "assert isinstance(name, str) and name.strip(), 'name must be a non-empty string'\nassert type(age) is int, 'age must be an int, like 15'\nassert type(height) is float, 'height must be a float, like 1.62'\nassert type(is_student) is bool, 'is_student must be True or False'",
         solution: "name = \"Asha\"\nage = 15\nheight = 1.62\nis_student = True\n\nfor value in (name, age, height, is_student):\n    print(value, type(value))\n" }),
     E("Problem", "Type conversion", "The prices arrive as text. Convert them and store their sum in total, then print it.",
       { starter: "a = \"12\"\nb = \"7.5\"\n\n# convert a to int and b to float, then add them\ntotal = \nprint(total)\n",
         check: "assert abs(total - 19.5) < 1e-9, 'total should be 19.5 (12 + 7.5)'",
         solution: "a = \"12\"\nb = \"7.5\"\ntotal = int(a) + float(b)\nprint(total)\n" }),
     E("Problem", "Build a sentence with an f-string", "Using name and age, make message equal to: Asha is 15 years old. Print it.",
       { starter: "name = \"Asha\"\nage = 15\n\nmessage = \nprint(message)\n",
         check: "assert message == f'{name} is {age} years old', 'message should be exactly: ' + f'{name} is {age} years old'",
         solution: "name = \"Asha\"\nage = 15\nmessage = f\"{name} is {age} years old\"\nprint(message)\n" }),
     E("Problem", "Read input and calculate", "Ask for the length and width of a rectangle with input(), convert them to numbers, and store the area in area. The Input box already has 4 and 5.",
       { stdin: "4\n5", starter: "length = input(\"Length: \")\nwidth = input(\"Width: \")\n\narea = \nprint(\"Area:\", area)\n",
         check: "assert float(area) == 20, 'area should be 20 when the inputs are 4 and 5'",
         solution: "length = float(input(\"Length: \"))\nwidth = float(input(\"Width: \"))\narea = length * width\nprint(\"Area:\", area)\n" })]),
  T("py-loops", "python", "🔁", "Loops and conditions", "Beginner",
    "Make your programs decide and repeat. You will write if, elif and else to choose between actions, and for and while loops to repeat work, then combine them to solve classic problems like grading, sums and FizzBuzz. Run your code to see the output and errors, and use Check to test it.",
    ["if / elif / else run the first block whose condition is True.", "for i in range(1, 6) repeats with i = 1, 2, 3, 4, 5.", "while repeats as long as its condition stays True; make sure it ends.", "% gives the remainder: n % 2 == 0 means n is even."],
    [E("Playground", "Code playground", "Write and run any Python code.", { free: true, starter: "for i in range(1, 6):\n    if i % 2 == 0:\n        print(i, \"is even\")\n    else:\n        print(i, \"is odd\")\n" }),
     E("Problem", "Even or odd", "Complete even_or_odd(n) so it returns \"even\" or \"odd\".",
       { starter: "def even_or_odd(n):\n    # return \"even\" or \"odd\"\n    pass\n\nprint(even_or_odd(4))\nprint(even_or_odd(7))\n",
         check: "for n, want in [(4, 'even'), (7, 'odd'), (0, 'even'), (-3, 'odd')]:\n    got = even_or_odd(n)\n    assert got == want, f'even_or_odd({n}) returned {got!r}, expected {want!r}'",
         solution: "def even_or_odd(n):\n    return \"even\" if n % 2 == 0 else \"odd\"\n" }),
     E("Problem", "Grade calculator", "Return A for 90 and above, B for 75 to 89, C for 60 to 74, D for 40 to 59, and F below 40.",
       { starter: "def grade(marks):\n    pass\n\nprint(grade(95), grade(80), grade(62), grade(45), grade(12))\n",
         check: "cases = [(100,'A'),(90,'A'),(89,'B'),(75,'B'),(74,'C'),(60,'C'),(59,'D'),(40,'D'),(39,'F'),(0,'F')]\nfor m, want in cases:\n    got = grade(m)\n    assert got == want, f'grade({m}) returned {got!r}, expected {want!r}'",
         solution: "def grade(marks):\n    if marks >= 90:\n        return \"A\"\n    elif marks >= 75:\n        return \"B\"\n    elif marks >= 60:\n        return \"C\"\n    elif marks >= 40:\n        return \"D\"\n    return \"F\"\n" }),
     E("Problem", "Sum with a loop", "Use a loop (not the sum function) to return the total of 1 + 2 + ... + n.",
       { starter: "def total(n):\n    result = 0\n    # add the numbers from 1 to n\n    return result\n\nprint(total(10))  # 55\n",
         check: "for n, want in [(1, 1), (10, 55), (100, 5050), (0, 0)]:\n    got = total(n)\n    assert got == want, f'total({n}) returned {got}, expected {want}'",
         solution: "def total(n):\n    result = 0\n    for i in range(1, n + 1):\n        result += i\n    return result\n" }),
     E("Problem", "FizzBuzz", "Return a list for 1 to n: \"Fizz\" for multiples of 3, \"Buzz\" for 5, \"FizzBuzz\" for both, otherwise the number.",
       { starter: "def fizzbuzz(n):\n    out = []\n    return out\n\nprint(fizzbuzz(15))\n",
         check: "got = fizzbuzz(15)\nwant = [1, 2, 'Fizz', 4, 'Buzz', 'Fizz', 7, 8, 'Fizz', 'Buzz', 11, 'Fizz', 13, 14, 'FizzBuzz']\nassert got == want, f'fizzbuzz(15) returned {got}'",
         solution: "def fizzbuzz(n):\n    out = []\n    for i in range(1, n + 1):\n        if i % 15 == 0:\n            out.append(\"FizzBuzz\")\n        elif i % 3 == 0:\n            out.append(\"Fizz\")\n        elif i % 5 == 0:\n            out.append(\"Buzz\")\n        else:\n            out.append(i)\n    return out\n" })]),
  T("py-oop", "python", "🧱", "Object oriented programming", "Intermediate",
    "Model real things in code with classes and objects. You will write classes with attributes and methods, use __init__ and __str__, raise errors for invalid actions, and use inheritance to share code between related classes. Run your classes, test them in the editor, and press Check to verify them.",
    ["A class is a blueprint; an object is one thing built from it.", "__init__ sets up a new object; self is the object itself.", "Methods are functions that belong to a class.", "A child class inherits from a parent: class Circle(Shape)."],
    [E("Playground", "Code playground", "Write and run any Python code.", { free: true, starter: "class Dog:\n    def __init__(self, name):\n        self.name = name\n\n    def speak(self):\n        return f\"{self.name} says woof\"\n\nprint(Dog(\"Bruno\").speak())\n" }),
     E("Problem", "Student class", "Write a Student class with name and a marks list, add_mark(m), and average() that returns 0 when there are no marks.",
       { starter: "class Student:\n    def __init__(self, name):\n        pass\n\n    def add_mark(self, m):\n        pass\n\n    def average(self):\n        pass\n\ns = Student(\"Asha\")\ns.add_mark(80)\ns.add_mark(90)\nprint(s.name, s.average())\n",
         check: "s = Student('Ravi')\nassert s.name == 'Ravi', 'name should be stored in self.name'\nassert s.average() == 0, 'average() should be 0 when there are no marks'\ns.add_mark(70); s.add_mark(80); s.add_mark(90)\nassert s.average() == 80, f'average of 70, 80, 90 should be 80, got {s.average()}'",
         solution: "class Student:\n    def __init__(self, name):\n        self.name = name\n        self.marks = []\n\n    def add_mark(self, m):\n        self.marks.append(m)\n\n    def average(self):\n        return sum(self.marks) / len(self.marks) if self.marks else 0\n" }),
     E("Problem", "Bank account", "Write BankAccount with balance starting at 0, deposit(amount), and withdraw(amount) that raises ValueError if there is not enough money.",
       { starter: "class BankAccount:\n    def __init__(self):\n        pass\n\n    def deposit(self, amount):\n        pass\n\n    def withdraw(self, amount):\n        pass\n\nacc = BankAccount()\nacc.deposit(100)\nacc.withdraw(30)\nprint(acc.balance)\n",
         check: "a = BankAccount()\nassert a.balance == 0, 'balance should start at 0'\na.deposit(100); a.withdraw(40)\nassert a.balance == 60, f'balance should be 60, got {a.balance}'\ntry:\n    a.withdraw(1000)\n    raise AssertionError('withdraw(1000) should raise ValueError when balance is 60')\nexcept ValueError:\n    pass\nassert a.balance == 60, 'a failed withdrawal must not change the balance'",
         solution: "class BankAccount:\n    def __init__(self):\n        self.balance = 0\n\n    def deposit(self, amount):\n        self.balance += amount\n\n    def withdraw(self, amount):\n        if amount > self.balance:\n            raise ValueError(\"Not enough money\")\n        self.balance -= amount\n" }),
     E("Problem", "Inheritance: shapes", "Rectangle(w, h) and Circle(r) both inherit from Shape and override area(). Use 3.14159 or math.pi for pi.",
       { starter: "import math\n\nclass Shape:\n    def area(self):\n        return 0\n\nclass Rectangle(Shape):\n    pass\n\nclass Circle(Shape):\n    pass\n\nprint(Rectangle(3, 4).area(), round(Circle(1).area(), 2))\n",
         check: "assert issubclass(Rectangle, Shape) and issubclass(Circle, Shape), 'Rectangle and Circle must inherit from Shape'\nassert Rectangle(3, 4).area() == 12, 'Rectangle(3, 4).area() should be 12'\nassert abs(Circle(2).area() - 12.566) < 0.01, 'Circle(2).area() should be about 12.57'",
         solution: "import math\n\nclass Shape:\n    def area(self):\n        return 0\n\nclass Rectangle(Shape):\n    def __init__(self, w, h):\n        self.w, self.h = w, h\n\n    def area(self):\n        return self.w * self.h\n\nclass Circle(Shape):\n    def __init__(self, r):\n        self.r = r\n\n    def area(self):\n        return math.pi * self.r ** 2\n" }),
     E("Problem", "Printing objects with __str__", "Give Book a __str__ so print(Book(\"Wings of Fire\", \"A. P. J. Abdul Kalam\")) shows: Wings of Fire by A. P. J. Abdul Kalam",
       { starter: "class Book:\n    def __init__(self, title, author):\n        self.title = title\n        self.author = author\n\nprint(Book(\"Wings of Fire\", \"A. P. J. Abdul Kalam\"))\n",
         check: "assert str(Book('Gitanjali', 'Rabindranath Tagore')) == 'Gitanjali by Rabindranath Tagore', 'str(book) should look like: Gitanjali by Rabindranath Tagore'",
         solution: "class Book:\n    def __init__(self, title, author):\n        self.title = title\n        self.author = author\n\n    def __str__(self):\n        return f\"{self.title} by {self.author}\"\n" })]),
  T("py-projects", "python", "🚀", "Mini project", "Project",
    "Put everything together in small, complete programs. You will build a guessing game, a to-do manager, a marks report and a quiz, using variables, loops, conditions, functions and classes. Type your code, run it with test input, fix the errors you see, and send the finished project to your mentor for review.",
    ["Plan first: write the steps in comments before the code.", "Build one small piece, run it, then add the next.", "Put repeated work in functions with clear names.", "Test with normal input, empty input and wrong input."],
    [E("Playground", "Code playground", "Write and run any Python code.", { free: true, starter: "# Plan your project here, then build it step by step\n" }),
     E("Project", "Number guessing game", "The computer picks 1 to 20. The player guesses with input() and gets \"Too high\" or \"Too low\" until correct, then sees the number of attempts. Put test guesses in the Input box.",
       { stdin: "10\n15\n12\n13\n14\n11\n16\n17\n18\n19\n20\n1\n2\n3\n4\n5\n6\n7\n8\n9", starter: "import random\n\nsecret = random.randint(1, 20)\nattempts = 0\n\n# your game loop here\n",
         solution: "import random\n\nsecret = random.randint(1, 20)\nattempts = 0\nwhile True:\n    guess = int(input(\"Guess (1-20): \"))\n    attempts += 1\n    if guess < secret:\n        print(\"Too low\")\n    elif guess > secret:\n        print(\"Too high\")\n    else:\n        print(f\"Correct! {attempts} attempts\")\n        break\n" }),
     E("Project", "To-do list manager", "Write a TodoList class with add(task), complete(task), and pending() that returns tasks not yet completed, in order.",
       { starter: "class TodoList:\n    def __init__(self):\n        pass\n\n    def add(self, task):\n        pass\n\n    def complete(self, task):\n        pass\n\n    def pending(self):\n        pass\n\ntodo = TodoList()\ntodo.add(\"Practise piano\")\ntodo.add(\"Finish homework\")\ntodo.complete(\"Practise piano\")\nprint(todo.pending())\n",
         check: "t = TodoList()\nfor x in ['a', 'b', 'c']:\n    t.add(x)\nt.complete('b')\nassert t.pending() == ['a', 'c'], f'pending() should be [\"a\", \"c\"], got {t.pending()}'\nt.complete('a'); t.complete('c')\nassert t.pending() == [], 'pending() should be empty when all tasks are done'",
         solution: "class TodoList:\n    def __init__(self):\n        self.tasks = []\n        self.done = set()\n\n    def add(self, task):\n        self.tasks.append(task)\n\n    def complete(self, task):\n        self.done.add(task)\n\n    def pending(self):\n        return [t for t in self.tasks if t not in self.done]\n" }),
     E("Project", "Marks report", "Write report(students) that returns a dict with the class average, the top student's name, and a list of names who scored below 40.",
       { starter: "students = [\n    {\"name\": \"Asha\", \"marks\": 88},\n    {\"name\": \"Ravi\", \"marks\": 35},\n    {\"name\": \"Meena\", \"marks\": 92},\n    {\"name\": \"John\", \"marks\": 61},\n]\n\ndef report(students):\n    # return {\"average\": ..., \"top\": ..., \"failed\": [...]}\n    pass\n\nprint(report(students))\n",
         check: "r = report([{'name': 'A', 'marks': 50}, {'name': 'B', 'marks': 90}, {'name': 'C', 'marks': 10}])\nassert abs(r['average'] - 50) < 1e-9, f'average should be 50, got {r[\"average\"]}'\nassert r['top'] == 'B', f'top should be B, got {r[\"top\"]}'\nassert r['failed'] == ['C'], f'failed should be [\"C\"], got {r[\"failed\"]}'",
         solution: "def report(students):\n    marks = [s[\"marks\"] for s in students]\n    top = max(students, key=lambda s: s[\"marks\"])[\"name\"]\n    return {\n        \"average\": sum(marks) / len(marks),\n        \"top\": top,\n        \"failed\": [s[\"name\"] for s in students if s[\"marks\"] < 40],\n    }\n" }),
     E("Project", "Quiz game", "Store at least five questions and answers in a list, ask each with input(), count the score and print the final result. Put test answers in the Input box.",
       { stdin: "Delhi\n4\nPython\nblue\n7", starter: "questions = [\n    (\"Capital of India?\", \"delhi\"),\n    (\"2 + 2?\", \"4\"),\n]\n\nscore = 0\n# ask each question and count the score\n",
         solution: "questions = [\n    (\"Capital of India?\", \"delhi\"),\n    (\"2 + 2?\", \"4\"),\n    (\"Language of this course?\", \"python\"),\n    (\"Colour of a clear sky?\", \"blue\"),\n    (\"Days in a week?\", \"7\"),\n]\nscore = 0\nfor q, a in questions:\n    if input(q + \" \").strip().lower() == a:\n        score += 1\nprint(f\"Score: {score}/{len(questions)}\")\n" })])
];
const TOPIC = (id) => TOPICS.find(t => t.id === id);
const EXERCISE = (id) => { for (const t of TOPICS) { const e = t.ex.find(x => x.id === id); if (e) return e; } return null; };
const topicsOf = (cat) => TOPICS.filter(t => t.cat === cat);

const REFS = {
  music: [["Musicca: free music exercises", "https://www.musicca.com/exercises"], ["Musicca lessons: notes, intervals, chords", "https://www.musicca.com/lessons"], ["musictheory.net lessons", "https://www.musictheory.net/lessons"]],
  speaking: [["Toastmasters International", "https://www.toastmasters.org/"], ["TED talks on public speaking", "https://www.ted.com/playlists/226/before_public_speaking"]],
  python: [["Official Python tutorial", "https://docs.python.org/3/tutorial/"], ["PEP 8 style guide", "https://peps.python.org/pep-0008/"], ["Python built-in functions", "https://docs.python.org/3/library/functions.html"]]
};

/* ---------- demo mentors (logins are in docs/mentor-accounts.md, not shown in the app) ---------- */
const DEMO_PASS = "mentor123";
const SEED_MENTORS = [
  { name: "Anjali Rao", email: "anjali@learnbridge.demo", category: "music", topics: ["piano", "violin"], skills: ["Piano", "Violin", "Sight-reading", "Music theory"], experience: 12, mode: "online", location: "Bengaluru", availability: "Mon, Wed, Fri, 6 to 8 pm", bio: "Piano and violin teacher. I help beginners read notes confidently and play with a clean, steady sound.", stories: ["Took a student from no training to a graded piano exam distinction in 14 months."] },
  { name: "Kiran Menon", email: "kiran@learnbridge.demo", category: "music", topics: ["violin", "guitar"], skills: ["Violin", "Guitar", "Intonation", "Bowing"], experience: 8, mode: "offline", location: "Kochi", availability: "Weekends, 10 am to 1 pm", bio: "String player and teacher. Clean technique, good intonation and steady time.", stories: ["Students regularly perform at the annual community music festival."] },
  { name: "Daniel D'Souza", email: "daniel@learnbridge.demo", category: "music", topics: ["guitar", "piano", "drums"], skills: ["Guitar", "Piano", "Drum kit", "Band coaching"], experience: 10, mode: "online", location: "Goa", availability: "Tue to Sat, 4 to 8 pm", bio: "Band musician and teacher. We learn songs you love while building real technique.", stories: ["Coached a school band that won the inter-school music fest."] },
  { name: "Suresh Bhat", email: "suresh@learnbridge.demo", category: "music", topics: ["drums"], skills: ["Drum kit", "Rhythm", "Timing"], experience: 15, mode: "offline", location: "Hubballi", availability: "Daily, 7 to 9 am", bio: "Drummer with fifteen years of teaching. Rhythm first, speed later.", stories: ["Five students now play in working bands."] },
  { name: "Farah Qureshi", email: "farah@learnbridge.demo", category: "music", topics: ["piano", "guitar"], skills: ["Piano", "Guitar", "Songwriting"], experience: 6, mode: "online", location: "Pune", availability: "Tue and Thu evenings", bio: "Musician and songwriter. I teach you to play the songs you love.", stories: ["A student's first song, written in our sessions, reached 50,000 streams."] },
  { name: "Meera Iyer", email: "meera@learnbridge.demo", category: "speaking", topics: ["self-intro", "presentation", "debate"], skills: ["Public speaking", "Presentations", "Debate"], experience: 10, mode: "online", location: "Chennai", availability: "Daily, 7 to 9 pm", bio: "Speaking coach for students and professionals. Practical drills, honest feedback.", stories: ["Helped a shy engineering student win an inter-college debate."] },
  { name: "Arjun Shetty", email: "arjun@learnbridge.demo", category: "speaking", topics: ["interview", "self-intro", "presentation"], skills: ["Interview skills", "Self introduction", "Presentations"], experience: 7, mode: "offline", location: "Mangaluru", availability: "Sat and Sun, 4 to 7 pm", bio: "HR trainer turned communication mentor. I prepare you for interviews and presentations.", stories: ["Most of my students clear their campus interview on the first attempt."] },
  { name: "Leena Thomas", email: "leena@learnbridge.demo", category: "speaking", topics: ["pronunciation", "debate", "interview"], skills: ["Pronunciation", "Accent training", "Debate"], experience: 9, mode: "online", location: "Thiruvananthapuram", availability: "Mon to Fri, 5 to 7 pm", bio: "English and debate coach. Clear speech, strong arguments.", stories: ["Coached state-level debate finalists three years running."] },
  { name: "Nikhil Joshi", email: "nikhil@learnbridge.demo", category: "python", topics: ["py-basics", "py-loops"], skills: ["Python basics", "Problem solving", "Patience"], experience: 9, mode: "online", location: "Hyderabad", availability: "Mon to Fri, 5 to 7 pm", bio: "I teach Python to absolute beginners. No question is too small.", stories: ["Guided an accountant to automate her monthly reports in Python."] },
  { name: "Divya Kulkarni", email: "divya@learnbridge.demo", category: "python", topics: ["py-oop", "py-projects"], skills: ["Object oriented Python", "Projects", "Testing"], experience: 11, mode: "online", location: "Bengaluru", availability: "Weekends, flexible", bio: "Senior backend engineer mentoring intermediate learners on clean, tested Python.", stories: ["Mentees now work at product companies and open-source projects."] },
  { name: "Rahul Gowda", email: "rahul@learnbridge.demo", category: "python", topics: ["py-loops", "py-projects", "py-basics"], skills: ["Debugging", "Mini-projects", "Loops and logic"], experience: 5, mode: "offline", location: "Delhi", availability: "Tue, Thu, Sat mornings", bio: "Bring me your broken code and we will fix it together, step by step.", stories: ["Built 30+ small projects with students, from games to report tools."] }
];
async function seedIfNeeded() {
  const d = db(); let changed = false;
  for (const m of SEED_MENTORS) {
    const cur = d.mentors.find(x => x.email === m.email);
    if (cur) {
      // keep demo mentors in step with the current activity list
      if (cur.demo && JSON.stringify(cur.topics) !== JSON.stringify(m.topics)) { Object.assign(cur, { topics: m.topics, skills: m.skills, bio: m.bio, stories: m.stories }); changed = true; }
      continue;
    }
    const salt = uid("s");
    d.mentors.push({ id: uid("m"), ...m, salt, passHash: await hashPass(DEMO_PASS, salt), demo: true, createdAt: Date.now() });
    changed = true;
  }
  // mentors who registered themselves keep only topics that still exist
  for (const m of d.mentors) if (!m.demo && Array.isArray(m.topics)) { const keep = m.topics.filter(id => TOPIC(id)); if (keep.length !== m.topics.length) { m.topics = keep; changed = true; } }
  if (changed) save();
}

/* ---------- media: platform asset store when available, else this browser (IndexedDB) ---------- */
const capCache = {};
function getCap(name) {
  if (!(name in capCache)) capCache[name] = (async () => { try { return window.claude?.use ? await window.claude.use(name) : null; } catch (e) { return null; } })();
  return capCache[name];
}
const IDB = (() => {
  let p = null;
  const open = () => p || (p = new Promise((res, rej) => { const r = indexedDB.open("learnbridge_media", 1); r.onupgradeneeded = () => r.result.createObjectStore("files"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
  return {
    async put(id, blob) { const d = await open(); return new Promise((res, rej) => { const tx = d.transaction("files", "readwrite"); tx.objectStore("files").put(blob, id); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); },
    async get(id) { const d = await open(); return new Promise((res, rej) => { const r = d.transaction("files").objectStore("files").get(id); r.onsuccess = () => res(r.result || null); r.onerror = () => rej(r.error); }); }
  };
})();
const EXT_MIME = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", mp4: "video/mp4", m4a: "audio/mp4", webm: "video/webm", mov: "video/quicktime", mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", pdf: "application/pdf", txt: "text/plain", md: "text/markdown", csv: "text/csv", json: "application/json", py: "text/plain" };
function guessMime(name, t) { if (t) return t.split(";")[0]; const ext = (name.split(".").pop() || "").toLowerCase(); return EXT_MIME[ext] || "application/octet-stream"; }
function assetType(mime) {
  if (/^image\/(png|jpeg|gif|webp)$/.test(mime)) return mime;
  if (mime === "video/mp4" || mime === "audio/mp4" || mime === "audio/x-m4a") return "video/mp4";
  if (mime === "video/webm" || mime === "audio/webm") return "video/webm";
  if (mime === "application/pdf") return mime;
  if (/^(text\/plain|text\/markdown|text\/csv|application\/json)$/.test(mime)) return mime;
  return null;
}
const MAX_FILE = 20 * 1024 * 1024;
async function storeFile(blob, name, owner) {
  const mime = guessMime(name, blob.type);
  if (blob.size > 60 * 1024 * 1024) throw new Error("too_large");
  const meta = { id: uid("f"), name: name || "file", mime, size: blob.size, owner, createdAt: Date.now() };
  const assets = await getCap("assets"), at = assetType(mime);
  if (assets && at && blob.size <= MAX_FILE) {
    try { const r = await assets.upload(blob, { type: at }); meta.store = "asset"; meta.assetId = r.id; } catch (e) { /* fall back to this browser */ }
  }
  if (!meta.store) { await IDB.put(meta.id, blob); meta.store = "idb"; }
  db().media.push(meta);
  return meta.id;
}
async function storeFiles(list, owner) { const ids = []; for (const f of list) ids.push(await storeFile(f.blob || f, f.name || "file", owner)); return ids; }
const mediaMeta = (id) => db().media.find(m => m.id === id);
async function mediaBlob(meta) {
  if (meta.store === "asset") { const r = await fetch("/_blob/" + meta.assetId); if (!r.ok) throw new Error("fetch"); return r.blob(); }
  return IDB.get(meta.id);
}
const blobToDataUrl = (b) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });
async function mediaSrc(meta) {
  if (meta.store === "asset") return "/_blob/" + meta.assetId;
  const b = await IDB.get(meta.id); if (!b) return null;
  return blobToDataUrl(b); // data: URLs play reliably inside embedded views
}
const DL_OK = ["gif", "png", "jpg", "jpeg", "webp", "mp4", "webm", "txt", "json", "md", "csv", "svg", "pdf", "html", "docx", "pptx", "xlsx", "zip"];
function dlName(meta) {
  let base = (meta.name || "file").replace(/[^\w.\- ]+/g, "_"), ext = (base.includes(".") ? base.split(".").pop() : "").toLowerCase();
  if (DL_OK.includes(ext)) return base;
  const m = meta.mime;
  const mapped = /webm/.test(m) ? "webm" : /mp4|m4a/.test(m) ? "mp4" : m === "image/jpeg" ? "jpg" : m === "image/png" ? "png" : m === "application/pdf" ? "pdf" : /^text\//.test(m) ? "txt" : null;
  return mapped ? base.replace(/\.[^.]*$/, "") + "." + mapped : null;
}
async function downloadMedia(id) {
  const meta = mediaMeta(id); if (!meta) return toast("File not found on this device.");
  const name = dlName(meta);
  if (!name) { return toast("This file type (" + meta.mime + ") can be played here but not saved. Use MP4, WebM, JPG, PNG, PDF or TXT."); }
  let blob; try { blob = await mediaBlob(meta); } catch (e) { blob = null; }
  if (!blob) return toast("Could not read the file.");
  offerDownload(name, blob);
}
async function offerDownload(filename, data) {
  const cap = await getCap("downloads");
  if (cap) {
    try { await cap.save({ filename, data }); toast("Saved " + filename); return; }
    catch (e) {
      if (e?.code === "declined") return;
      if (e?.code === "rate_limited") return toast("A save prompt is already open.");
      if (e?.code === "rejected_extension") return toast("That file type cannot be saved here.");
    }
  }
  const blob = data instanceof Blob ? data : new Blob([data], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = await blobToDataUrl(blob); a.download = filename; a.target = "_blank";
  document.body.appendChild(a); a.click(); a.remove();
}
