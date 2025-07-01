import React from "react";
import LandNav from '../components/Navbar.jsx';
import FeetDroolEmoji from '../components/Footer.jsx';
import PricingSection from '../components/Pricing.jsx';
import { LandSection, LandSectionRight } from '../components/LandSection.jsx';
import inter from '../assets/intergration.jpg';
import teacher from '../assets/struggle-teacher.jpg';
import multi from '../assets/multi-choice.jpg';

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
        <div id="features">
            <LandSection name={firstName} txt={firstTXT} img={multi}/>
            <LandSectionRight name={seconName} txt={seconTXT} img={teacher}/>
            <LandSection name={thirdName} txt={thirdTXT} img={inter}/>
            <LandSectionRight name={thirdName} txt={thirdTXT} img={inter}/>
        </div>
        <div id="pricing">
            <PricingSection/>
        </div>
        <div id="end">
            <FeetDroolEmoji/>
        </div>
    </div>
    );
};

export default Home;
