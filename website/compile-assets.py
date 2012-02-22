import os
import sys
import yaml
import json
import subprocess


def main(base_dir, target_dir):
    # Delete anything in the target directory
    subprocess.check_call(["rm", "-rf", target_dir])
    os.mkdir(target_dir)
    # Read the lines
    with open(os.path.join(base_dir, "system.yaml")) as fh:
        system = yaml.safe_load(fh)
    # For each station...
    system['stations'] = {}
    for station_code in os.listdir(base_dir):
        path = os.path.join(base_dir, station_code)
        if os.path.isdir(path):
            # Find and read its meta file
            for filename in os.listdir(path):
                if filename.endswith(".yaml"):
                    with open(os.path.join(path, filename)) as fh:
                        station = yaml.safe_load(fh)
                        break
            else:
                raise ValueError("Could not find YAML file for station %s" % station_code)
            # Copy its model file
            subprocess.check_call([
                "cp",
                os.path.join(path, station['model']),
                os.path.join(target_dir, "%s.three" % station_code),
            ])
            # Modify where the model path points
            station['model'] = "%s.three" % station_code
            # Write a detailed file
            with open(os.path.join(target_dir, "%s.json" % station_code), "w") as fh:
                json.dump(station, fh)
            # Save selected details into the Big Dict
            system['stations'][station_code] = {
                "title": station['title'],
                "lines": station['lines'],
                "model": station['model'],
                "meta": "%s.json" % station_code,
            }
            print "Parsed %s (%s)" % (station['title'], station_code)
    # Save that as a JSON blob
    with open(os.path.join(target_dir, "_system.json"), "w") as fh:
        json.dump(system, fh)

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
