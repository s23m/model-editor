import React from 'react';

//Right click menu component used to access certain function of program
export class ContextMenu extends React.Component {

    state = {
        xPos: "0px",
        yPos: "0px",
        showMenu: false
    }

    componentDidMount() {
        document.addEventListener("click", this.handleClick);
        document.addEventListener("contextmenu", this.handleContextMenu);
    }

    componentWillUnmount() {
        document.removeEventListener("click", this.handleClick);
        document.removeEventListener("contextmenu", this.handleContextMenu);
    }

    //The handle click method will check which option has been clicked and call the relevant method
    handleClick = (e) => {
        if (this.state.showMenu) {
            console.log(e)
            if(e.target.className === "Navigate"){
                console.log("Navigate selected")
            }
            
            if(e.target.className === "Move To"){
                console.log("Move To selected")
            }
            
            
            
            this.setState({ showMenu: false });
        }
    }

    //prevent default stops the regular contextmenu from appearing
    handleContextMenu = (e) => {
        e.preventDefault();
        
        this.setState({
            xPos: `${e.pageX}px`,
            yPos: `${e.pageY}px`,
            showMenu: true,
          });
        
    };
    

    render() {
        const { showMenu, yPos, xPos } = this.state;
        if (showMenu){
            return (

                //options are given classnames to identify what has been selected
                <ul className="ContextMenu" style={{top: yPos,left: xPos,}}>
                <li className="Navigate">Navigate</li>
                <li className="Move To">Move To</li>

                </ul>
            );
        }
    else return null;

  }
}
