import {
  Sketch,
  SketchProps,
  Params,
  Parameter,
  Config,
  MultiSelectOptions,
} from '@code-not-art/sketch';
import {
  Color,
  Constants,
  Gradient,
  grid,
  GridTile,
  Path,
  Vec2,
} from '@code-not-art/core';

const config = Config({
  menuDelay: 100,
});

const params: Parameter[] = [
  Params.header('Grid Options'),
  Params.range('gridScale', 0.95),
  Params.range('gridWidth', 8, [3, 55, 1]),
  Params.range('tileFill', 0.95),
  Params.range('colorNoise', 0.1, [0, 0.25, 0.001]),
  Params.header('Features Options'),
  Params.range('featureFill', 1, [0, 2]),
  Params.range('featureOpacity', 0.95),
  Params.multiselect('featuresEnabled', {
    empty: false,
    quarterCircle: true,
    semiCircle: false,
    circle: true,
    diagonal: true,
    swoop: false,
  }),
];

const draw = ({ canvas, palette, params, rng }: SketchProps) => {
  const gridScale = params.gridScale as number;
  const gridWidth = params.gridWidth as number;
  const colorNoise = params.colorNoise as number;
  const tileFill = params.tileFill as number;
  const featureFill = params.featureFill as number;
  const featureOpacity = params.featureOpacity as number;
  const featuresEnabled = params.featuresEnabled as MultiSelectOptions;

  const tileGradient = new Gradient(
    palette.colors[1],
    palette.colors[0],
    palette.colors[2],
    // palette.colors[3],
    // palette.colors[4],
  );
  const featureGradient = new Gradient(
    // palette.colors[3],
    palette.colors[2],
    palette.colors[1],
    palette.colors[0],
    // palette.colors[4],
  );
  const getColor = (
    x: number,
    y: number,
    gradient: Gradient,
    opacity: number,
  ): Color => {
    // const pos = Math.sqrt((x + 1) * (y + 1)) / gridWidth;
    const pos = ((x + y) / 2 / gridWidth) * 0.9 + 0.05;
    // return gradient.at(rng.fuzzy(pos).float(0.0001));
    // return gradient.at(pos + rng.next() * 0.1 - rng.next() * 0.1);
    return gradient.at(rng.fuzzy(pos).float(colorNoise)).set.alpha(opacity);
  };

  const drawSwoop = (tile: GridTile, size: Vec2) => {
    rng.push('swoop');
    const orientation = rng.int(0, 3);
    canvas.transform
      .push()
      .translate(tile.center)
      .rotate((Constants.TAU / 4) * orientation);
    const origin = Vec2.origin().add(size.scale(-0.5));

    const path = new Path(origin).bez2(
      origin.add(Vec2.unit().scale(size.x)),
      origin.add(size),
    );
    // .line(origin.add(Vec2.unit().scale(size.x)))
    // .bez2(origin.add(origin), origin.add(size));
    canvas.draw.path({
      path,
      fill: getColor(tile.column, tile.row, featureGradient, featureOpacity),
    });
    canvas.transform.pop();
    rng.pop();
  };

  const drawQuarterCircle = (tile: GridTile, size: Vec2) => {
    rng.push('quarter-circle');
    const orientation = rng.int(0, 3);
    canvas.transform
      .push()
      .translate(tile.center)
      .rotate((Constants.TAU / 4) * orientation);
    const origin = Vec2.origin().add(size.scale(-0.5));

    const path = new Path(origin)
      .line(origin.add(Vec2.unit().scale(size.x)))
      .bez2(
        origin.add(
          Vec2.unit()
            .rotate(Constants.TAU / 4)
            .scale(size.y),
        ),
        origin.add(size),
      );
    canvas.draw.path({
      path,
      fill: getColor(tile.column, tile.row, featureGradient, featureOpacity),
    });
    canvas.transform.pop();
    rng.pop();
  };

  const drawSemiCircle = (tile: GridTile, size: Vec2) => {
    rng.push('semi-circle');
    const orientation = rng.int(0, 3);
    canvas.transform
      .push()
      .translate(tile.center)
      .rotate((Constants.TAU / 4) * orientation);
    const origin = Vec2.origin().add(size.scale(-0.5)); // 0,0
    const destination = origin.add(Vec2.unit().scale(size.x)); // 1,0
    const control1 = origin.add(
      Vec2.unit()
        .rotate(Constants.TAU / 4)
        .scale(size.scale(1 / Math.sqrt(2))),
    ); // 0, about 2/3
    const control2 = control1.add(Vec2.unit().scale(size)); // 1, about 2/3

    const path = new Path(origin).bez3(destination, control1, control2);
    // .bez2(
    //   origin.add(Vec2.unit().scale(size.x)),
    //   origin.add(size),
    // );
    // .line(origin.add(Vec2.unit().scale(size.x)))
    canvas.draw.path({
      path,
      fill: getColor(tile.column, tile.row, featureGradient, featureOpacity),
    });
    canvas.transform.pop();
    rng.pop();
  };

  const drawCircle = (tile: GridTile, size: Vec2) => {
    rng.push('circle');
    canvas.transform.push().translate(tile.center);
    canvas.draw.circle({
      origin: Vec2.origin(),
      radius: size.scale(0.5).x * featureFill,
      fill: getColor(tile.column, tile.row, featureGradient, featureOpacity),
    });
    canvas.transform.pop();
    rng.pop();
  };

  const drawDiagonal = (tile: GridTile, size: Vec2) => {
    rng.push('diagonal');
    const _size = size.scale(featureFill);
    const orientation = rng.int(0, 3);
    canvas.transform
      .push()
      .translate(tile.center)
      .rotate((Constants.TAU / 4) * orientation);
    const origin = Vec2.origin().add(_size.scale(-0.5));
    const path = new Path(origin)
      .line(origin.add(Vec2.unit().scale(_size)))
      .line(
        origin.add(
          Vec2.unit()
            .scale(_size)
            .rotate(Constants.TAU / 4),
        ),
      );
    canvas.draw.path({
      path,
      fill: getColor(tile.column, tile.row, featureGradient, featureOpacity),
    });
    canvas.transform.pop();
    rng.pop();
  };

  const drawTile = (tile: GridTile) => {
    rng.push('tiles');
    const size = tile.size.scale(
      // tileFill * Math.abs(Math.sin(tile.uv.magnitude() * 2)) * 0.7 + 0.3,
      tileFill,
    );
    const point = tile.origin.add(tile.size.diff(size).scale(0.5));
    canvas.draw.rect({
      width: size.x + 1,
      height: size.y + 1,
      point,
      fill: getColor(tile.row, tile.column, tileGradient, 1),
    });
    rng.pop();
  };
  const drawFeature = (tile: GridTile) => {
    const size = tile.size.scale(
      // tileFill * Math.abs(Math.sin(tile.uv.magnitude() * 2)) * 0.7 + 0.3,
      tileFill,
    );
    rng.push('feature');
    const options = [];
    if (featuresEnabled.quarterCircle) {
      options.push(drawQuarterCircle);
    }
    if (featuresEnabled.semiCircle) {
      options.push(drawSemiCircle);
    }
    if (featuresEnabled.circle) {
      options.push(drawCircle);
    }
    if (featuresEnabled.diagonal) {
      options.push(drawDiagonal);
    }
    if (featuresEnabled.swoop) {
      options.push(drawSwoop);
    }
    if (options.length === 0 || featuresEnabled.empty) {
      options.push(() => {});
    }
    rng.chooseOne(options)(tile, size.scale(1.0)); //set 1.02 scaling to fix some off by one pixel artifacts, but can cause a weird overlap if the opacity is reduced
    rng.pop();
  };

  /* === Setup Canvas and draw grid === */

  canvas.fill('#222');
  canvas.fill('#eee');
  canvas.fill(palette.colors[0]);
  canvas.transform.translate(
    canvas.get.size().diff(canvas.get.size().scale(gridScale)).scale(0.5),
  );

  const tiles = rng.shuffle(
    grid({
      rows: gridWidth,
      columns: gridWidth,
      size: canvas.get.size().scale(gridScale),
    }),
  );
  tiles.forEach(drawTile);
  tiles.forEach(drawFeature);
};

export default Sketch({
  config,
  params,
  draw,
});
