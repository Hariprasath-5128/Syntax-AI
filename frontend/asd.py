import pkg_resources
import sys
print(sys.path)

installed_packages = [pkg.key for pkg in pkg_resources.working_set]
print(installed_packages)
