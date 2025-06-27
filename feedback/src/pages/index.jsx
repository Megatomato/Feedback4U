import React from "react";
import LandNav from '../components/Navbar.jsx';
import { LandSection, LandSectionRight } from '../components/LandSection.jsx';

const Home = () => {
    const firstName = "Motto";
    const firstTXT = "Easily provide custom feedback to your students without spending hours individually grading each paper.";

    const seconName = "Automate Drafting"
    const seconTXT = "Students can submit a draft at anytime along their writing process, providing instant feedback without an AI assistant writing their essay for them."

    const thirdName = "Customise it to your needs"
    const thirdTXT = "Utilize the API to create your own interface, connect it to an existing system or control what data students / teachers can see."

    return (
    <div>
        <LandNav/>
        <div>
            <LandSection name={firstName} txt={firstTXT}/>
            <LandSectionRight name={seconName} txt={seconTXT}/>
            <LandSection name={thirdName} txt={thirdTXT}/>
        </div>
    </div>
    );
};

export default Home;
