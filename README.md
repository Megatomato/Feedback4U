Summary Design Specification

1 Introduction

1.1 Purpose of Writing
Explain the purpose of writing this summary design specification and identify the intended readers.

1.2 Background
Explain: a. The name of the software system to be developed; b. List the task proposers, developers, users of this project, and the computing station (center) where the software will run.

1.3 Definitions
List the definitions of specialized terms used in this document and the original phrases of foreign acronyms.

1.4 References
List relevant reference documents, such as: a. The approved plan task book or contract for this project, and the official approval documents from higher authorities; b. Other published documents belonging to this project; c. Documents and materials cited in various parts of this document, including software development standards to be used. List the titles, document numbers, publication dates, and publishing units of these documents, and explain the sources where these documents and materials can be obtained.


2 Overall Design

2.1 Requirement Specifications
Explain the main input and output items of the system, as well as the functional and performance requirements for processing. For detailed explanations, please refer to Appendix C.

2.2 Operating Environment
Briefly explain the regulations on the operating environment of the system (including hardware environment and supporting environment). For detailed explanations, please refer to Appendix C.

2.3 Basic Design Concepts and Processing Flow
Explain the basic design concepts and processing flow of the system, and use diagrams as much as possible.

2.4 Structure
Illustrate the division of system elements (modules at all levels, subroutines, common programs, etc.) of the system in the form of a list and block diagrams. Briefly explain the identifier and function of each system element, and present the control and controlled relationships between elements hierarchically.

2.5 Relationship Between Functional Requirements and Programs

This section uses a matrix diagram as follows to explain the allocation relationship between the realization of each functional requirement and each program block:

Program 1      Program 2	……	Program n
Functional Requirement 1	√			
Functional Requirement 2		√		
……				
Functional Requirement n		√		√


2.6 Manual Processing Procedures
Explain the manual processing procedures that have to be included in the working process of the software system (if any).

2.7 Unresolved Issues
Explain the various issues that have not been resolved during the summary design process but are considered necessary to be solved before the system is completed by the designer.

3 Interface Design

3.1 User Interface
Explain the commands to be provided to users, their syntax structures, and the response information of the software.

3.2 External Interfaces
Explain the arrangements for all interfaces between the system and the outside world, including the interface between software and hardware, and the interface relationship between the system and various supporting software.

3.3 Internal Interfaces
Explain the arrangements for interfaces between various system elements within the system.

4 Operation Design

4.1 Operation Module Combination

Explain the various different operation module combinations caused by applying different external operation controls to the system, and describe the internal modules and supporting software that each operation goes through.

4.2 Operation Control
Explain the methods and operation steps for each type of external operation control.

4.3 Operation Time
Explain the time that each operation module combination will occupy various resources.

5 System Data Structure Design

5.1 Key Points of Logical Structure Design
Provide the name, identifier of each data structure used in the system, as well as the identification, definition, length of each data item, record, file, and system within them, and their hierarchical or tabular interrelationships.

5.2 Key Points of Physical Structure Design
Provide the storage requirements, access methods, access units, physical access relationships (indexes, devices, storage areas), design considerations, and confidentiality conditions for each data item in each data structure used in the system.

5.3 Relationship Between Data Structures and Programs
Explain the forms of each data structure and accessing these data structures.

6 System Error Handling Design

6.1 Error Messages
In the form of a list, explain the form, meaning, and processing method of the system output information when each possible error or fault occurs.

6.2 Remedial Measures
Explain the possible alternative measures after a fault occurs, including: a. Backup technology: Explain the backup technology to be adopted, the technology for establishing and starting the copy when the original system data is lost, for example, periodically recording disk information to tape is a backup technology for disk media; b. Degradation technology: Explain the backup technology to be adopted, using another system or method with slightly lower efficiency to obtain some parts of the required results, for example, the degradation technology of an automatic system can be manual operation and manual recording of data; c. Recovery and restart technology: Explain the recovery and restart technology to be used, the method to make the software resume execution from the fault point or restart the software from the beginning.

6.3 System Maintenance Design
Explain the arrangements made in the internal design of the program for the convenience of system maintenance, including the detection points and dedicated modules specially arranged in the program for system inspection and maintenance. The corresponding relationship between each program can be in the form of the following matrix diagram:


