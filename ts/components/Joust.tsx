import * as React from "react";

import SetupWidget from "./SetupWidget";
import GameWidget from "./GameWidget";
import HearthstoneJSON from "hearthstonejson";
import {InteractiveBackend, MulliganOracle} from "../interfaces";
import GameStateSink from "../state/GameStateSink";
import GameStateScrubber from "../state/GameStateScrubber";
import {CardOracle} from "../interfaces";
import {CardData} from "../interfaces";

const enum Widget {
	SETUP,
	GAME
}

interface JoustState {
	currentWidget?: Widget;
	cards?: CardData[];
	sink?: GameStateSink;
	scrubber?: GameStateScrubber;
	interaction?: InteractiveBackend;
	cardOracle?: CardOracle;
	mulliganOracle?: MulliganOracle;
}

class Joust extends React.Component<{}, JoustState> {

	private gameWidget: GameWidget;

	constructor() {
		super();
		this.state = {
			currentWidget: Widget.SETUP,
			cards: null,
			sink: null,
			interaction: null,
			scrubber: null,
			cardOracle: null,
			mulliganOracle: null,
		};
	}

	public componentDidMount() {
		let hsjson = new HearthstoneJSON();
		hsjson.get("latest", (cards: CardData[]) => {
			this.setState({ cards: cards });
		});
	}

	public render(): JSX.Element {
		var widget: JSX.Element = null;
		switch (this.state.currentWidget) {
			case Widget.SETUP:
				widget = <SetupWidget defaultHostname="localhost" defaultPort={9111}
					onSetup={this.onSetup.bind(this) }/>;
				break;
			case Widget.GAME:
				widget =
					<GameWidget sink={this.state.sink}
						startupTime={0}
						interaction={this.state.interaction}
						scrubber={this.state.scrubber}
						exitGame={this.exitGame.bind(this) }
						cardOracle={this.state.cardOracle}
						mulliganOracle={this.state.mulliganOracle}
						assetDirectory={(asset: string) => "./assets/" + asset}
						cardArtDirectory={null}
						enableKeybindings={true}
						ref={this.onMountGameWidget.bind(this) }
						/>;
				break;
		}

		return (
			<div className="joust">
				{widget}
				<footer>
					<p>
						Not affiliated with Blizzard. Get Hearthstone at <a href="battle.net/hearthstone/">Battle.net</a>.
					</p>
				</footer>
			</div>
		);
	}

	public onMountGameWidget(widget: GameWidget) {
		this.gameWidget = widget;
		if (widget && this.state.cards) {
			this.gameWidget.setCards(this.state.cards);
		}
	}

	public componentDidUpdate(prevProps: any, prevState: JoustState): void {
		if (!_.isEqual(prevState.cards, this.state.cards) && this.gameWidget) {
			this.gameWidget.setCards(this.state.cards);
		}
	}

	protected onSetup(sink: GameStateSink, interaction?: InteractiveBackend, scrubber?: GameStateScrubber, cardOracle?: CardOracle, mulliganOracle?: MulliganOracle): void {
		this.setState({
			currentWidget: Widget.GAME,
			sink: sink,
			interaction: interaction,
			scrubber: scrubber,
			cardOracle: cardOracle,
			mulliganOracle: mulliganOracle,
		});
	}

	protected exitGame() {
		this.state.sink.end();
		if (this.state.interaction) {
			this.state.interaction.exitGame();
		}
		this.setState({
			currentWidget: Widget.SETUP,
			sink: null,
			interaction: null,
			scrubber: null,
			cardOracle: null,
			mulliganOracle: null,
		});
	}
}

export default Joust;
