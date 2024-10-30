private handleCanvasDoubleClick = (
	event: React.MouseEvent<HTMLCanvasElement>,
) => {
	// case: double-clicking with arrow/line tool selected would both create
	// text and enter multiElement mode
	if (this.state.multiElement) {
		return;
	}
	// we should only be able to double click when mode is selection
	if (this.state.activeTool.type !== "selection") {
		return;
	}

	const selectedElements = this.scene.getSelectedElements(this.state);

	if (selectedElements.length === 1 && isLinearElement(selectedElements[0])) {
		if (
			event[KEYS.CTRL_OR_CMD] &&
			(!this.state.editingLinearElement ||
				this.state.editingLinearElement.elementId !== selectedElements[0].id)
		) {
			this.history.resumeRecording();
			this.setState({
				editingLinearElement: new LinearElementEditor(
					selectedElements[0],
					this.scene,
				),
			});
			return;
		} else if (
			this.state.editingLinearElement &&
			this.state.editingLinearElement.elementId === selectedElements[0].id
		) {
			return;
		}
	}

	resetCursor(this.interactiveCanvas);

	let { x: sceneX, y: sceneY } = viewportCoordsToSceneCoords(
		event,
		this.state,
	);

	const selectedGroupIds = getSelectedGroupIds(this.state);

	if (selectedGroupIds.length > 0) {
		const hitElement = this.getElementAtPosition(sceneX, sceneY);

		const selectedGroupId =
			hitElement &&
			getSelectedGroupIdForElement(hitElement, this.state.selectedGroupIds);

		if (selectedGroupId) {
			this.setState((prevState) => ({
				...prevState,
				...selectGroupsForSelectedElements(
					{
						editingGroupId: selectedGroupId,
						selectedElementIds: { [hitElement!.id]: true },
					},
					this.scene.getNonDeletedElements(),
					prevState,
					this,
				),
			}));
			return;
		}
	}

	resetCursor(this.interactiveCanvas);
	if (!event[KEYS.CTRL_OR_CMD] && !this.state.viewModeEnabled) {
		const hitElement = this.getElementAtPosition(sceneX, sceneY);

		if (isEmbeddableElement(hitElement)) {
			this.setState({
				activeEmbeddable: { element: hitElement, state: "active" },
			});
			return;
		}

		const container = getTextBindableContainerAtPosition(
			this.scene.getNonDeletedElements(),
			this.state,
			sceneX,
			sceneY,
		);

		if (container) {
			if (
				hasBoundTextElement(container) ||
				!isTransparent(container.backgroundColor) ||
				isHittingElementNotConsideringBoundingBox(
					container,
					this.state,
					this.frameNameBoundsCache,
					[sceneX, sceneY],
				)
			) {
				const midPoint = getContainerCenter(container, this.state);

				sceneX = midPoint.x;
				sceneY = midPoint.y;
			}
		}


		// Commented this for disable double click text

		/* this.startTextEditing({
			sceneX,
			sceneY,
			insertAtParentCenter: !event.altKey,
			container,
		}); */

		// New logic from geosakr

		const hitTextElement = this.getTextElementAtPosition(sceneX, sceneY);
		if (hitTextElement || (container && this.shouldAllowTextEditing(container))) {
			this.startTextEditing({
				sceneX,
				sceneY,
				insertAtParentCenter: !event.altKey,
				container,
			});
		}
	}
};

// New logic from geosakr

private shouldAllowTextEditing = (container: ExcalidrawElement): boolean => {
	return container.type === "rectangle" || container.type === "ellipse" || container.type === "diamond" || container.type === "line" || container.type === "arrow" || container.type === "text";
};